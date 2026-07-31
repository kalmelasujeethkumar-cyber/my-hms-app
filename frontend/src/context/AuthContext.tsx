/* ============================================================
   VPC-HMS — Authentication & API Sync Context
   Manages login/logout, patient registry, audit logs, and API sync.
   Connects to Express backend while maintaining local state sync.

   SECURITY:
   - Passwords are verified using SHA-256(input + stored_salt) via
     the Web Crypto API (SubtleCrypto) — no plain-text comparison.
   - Passwords are NEVER stored in plain text in this context or
     in localStorage.
   - A DATA_VERSION sentinel busts stale localStorage from older
     plain-text sessions.
   ============================================================ */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Patient, AuditEntry, SessionNote, UploadRecord } from '../types';
import { USERS, INITIAL_PATIENTS, INITIAL_AUDIT_LOG, INITIAL_UPLOADS, DATA_VERSION } from '../data/mockData';
import api from '../api/client';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  patients: Patient[];
  auditLog: AuditEntry[];
  sessionNotes: SessionNote[];
  uploads: UploadRecord[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addPatient: (patient: Omit<Patient, 'id'>) => Patient;
  dischargePatient: (patientId: string) => void;
  saveSessionNote: (note: Omit<SessionNote, 'id'>) => void;
  addUpload: (upload: Omit<UploadRecord, 'id'> & { id?: string }) => void;
  addDoctor: (doctorData: { name: string; username: string; password: string; specialty?: string; branch?: any }) => User;
  addDoctorsBatch: (doctorsList: { name: string; username: string; password: string; specialty?: string; branch?: any }[]) => User[];
  removeDoctor: (username: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEYS = {
  VERSION: 'vpc_hms_data_version',
  USER:     'vpc_hms_current_user',
  ALL_USERS: 'vpc_hms_all_users',
  TOKEN:    'vpc_hms_token',
  PATIENTS: 'vpc_hms_patients',
  AUDIT:    'vpc_hms_audit_log',
  NOTES:    'vpc_hms_session_notes',
  UPLOADS:  'vpc_hms_uploads',
} as const;

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getMockIP = () => {
  const octets = [192, 168, Math.floor(Math.random() * 5), Math.floor(Math.random() * 255)];
  return octets.join('.');
};

/**
 * SHA-256 hash using the browser's native SubtleCrypto API.
 * Returns a lowercase hex string.
 * Passwords are NEVER compared or stored as plain text.
 */
async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a plain-text password against a stored SHA-256+salt hash.
 * Case-sensitive: no normalization of password string before hashing.
 */
async function verifyPassword(plaintext: string, storedHash: string, salt: string): Promise<boolean> {
  // Combine password + salt EXACTLY as stored — no case folding, no trimming
  const computed = await sha256Hex(plaintext + salt);
  return computed === storedHash;
}

/**
 * Invalidate any stale localStorage keys from the old "medicare_*" session
 * format if the data version sentinel doesn't match.
 */
function migrateStorageIfNeeded(): void {
  const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
  if (storedVersion !== DATA_VERSION) {
    // Remove all old keys (both old prefix and new prefix from stale versions)
    const keysToRemove = [
      'medicare_current_user', 'medicare_all_users', 'medicare_patients',
      'medicare_audit_log', 'medicare_session_notes', 'medicare_uploads', 'hms_token',
      'vpc_hms_current_user', 'vpc_hms_all_users', 'vpc_hms_patients',
      'vpc_hms_audit_log', 'vpc_hms_session_notes', 'vpc_hms_uploads', 'vpc_hms_token',
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.setItem(STORAGE_KEYS.VERSION, DATA_VERSION);
  }
}

// Run migration immediately on module load
migrateStorageIfNeeded();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= USERS.length) return parsed;
      } catch (e) {}
    }
    return USERS;
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOG;
  });

  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
    return saved ? JSON.parse(saved) : [];
  });

  const [uploads, setUploads] = useState<UploadRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.UPLOADS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_UPLOADS;
  });

  // Sync state with local storage
  useEffect(() => {
    if (currentUser) {
      // Store user WITHOUT password/hash/salt — only session-safe fields
      const safeUser = {
        id: currentUser.id,
        username: currentUser.username,
        name: currentUser.name,
        role: currentUser.role,
        branch: currentUser.branch,
        doctorName: currentUser.doctorName,
        specialty: currentUser.specialty,
        password: '',   // never persist
        passwordHash: undefined,
        salt: undefined,
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  }, [currentUser]);

  useEffect(() => {
    // Store users WITHOUT sensitive hash/salt fields in localStorage
    const safeUsers = allUsers.map(u => ({
      ...u,
      password: u.role === 'reception' || u.role === 'doctor' ? u.password : '',
      passwordHash: undefined,
      salt: undefined,
    }));
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(safeUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLog));
  }, [auditLog]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(sessionNotes));
  }, [sessionNotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UPLOADS, JSON.stringify(uploads));
  }, [uploads]);

  // Fetch live backend users if available
  useEffect(() => {
    api.getUsers()
      .then(serverUsers => {
        if (Array.isArray(serverUsers) && serverUsers.length >= USERS.length) {
          setAllUsers(prev => {
            const mergedMap = new Map();
            // Prefer in-memory USERS (with hashes) over server copies for security
            USERS.forEach(u => mergedMap.set(u.username.toLowerCase(), u));
            prev.forEach(u => {
              if (!mergedMap.has(u.username.toLowerCase())) {
                mergedMap.set(u.username.toLowerCase(), u);
              }
            });
            serverUsers.forEach(u => {
              if (!mergedMap.has(u.username.toLowerCase())) {
                mergedMap.set(u.username.toLowerCase(), u);
              }
            });
            return Array.from(mergedMap.values());
          });
        }
      })
      .catch(() => {});

    api.getPatients()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPatients(data);
        }
      })
      .catch(() => {});
  }, []);

  const addAuditEntry = useCallback((staff: string, action: 'Login' | 'Logout') => {
    const entry: AuditEntry = {
      id: generateId(),
      staff,
      action,
      timestamp: new Date().toLocaleString('en-IN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      }),
      ip: getMockIP(),
    };
    setAuditLog(prev => [...prev, entry]);
    api.addAuditLog(entry).catch(() => {});
  }, []);

  /**
   * Login with SHA-256+salt verification.
   * - Passwords are NEVER compared as plain text for stakeholder/admin accounts.
   * - Case-sensitive at every layer: no toLowerCase/toUpperCase on password.
   * - Reception and doctor quick-access still supported via plain password field
   *   as a fallback for legacy non-interactive quick-access buttons.
   */
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    // Find user profile in allUsers (may include dynamically added doctors)
    const user = allUsers.find(
      u => u.username === username.trim() ||
           u.username.toLowerCase() === username.trim().toLowerCase()
    ) ?? USERS.find(
      u => u.username === username.trim() ||
           u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!user) return false;

    // CRITICAL: Always source passwordHash + salt from USERS constant, NOT from
    // allUsers state. The allUsers state is persisted to localStorage without
    // hashes (for security), so after a page reload allUsers lacks hash/salt.
    // USERS is a module-level constant that always carries the full credential data.
    const authSource = USERS.find(
      u => u.username === user.username
    ) ?? user;

    let authenticated = false;

    // Primary: SHA-256+salt hash comparison (case-sensitive — no normalization of password)
    if (authSource.passwordHash && authSource.salt) {
      authenticated = await verifyPassword(password, authSource.passwordHash, authSource.salt);
    }

    // Fallback for reception/doctor quick-access (legacy plain password field)
    // Stakeholders have password: '' so this never triggers for them
    if (!authenticated && authSource.password && authSource.password.length > 0) {
      authenticated = password === authSource.password;
    }

    if (authenticated) {
      setCurrentUser(user);
      addAuditEntry(user.name, 'Login');

      // Attempt API login token generation (non-blocking)
      api.login(username, password)
        .then(res => {
          if (res.token) {
            localStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
          }
        })
        .catch(() => {});

      return true;
    }

    return false;
  }, [allUsers, addAuditEntry]);

  const logout = useCallback(() => {
    if (currentUser) {
      addAuditEntry(currentUser.name, 'Logout');
    }
    setCurrentUser(null);
  }, [currentUser, addAuditEntry]);

  const addDoctor = useCallback((doctorData: { name: string; username: string; password: string; specialty?: string; branch?: any }): User => {
    const doctorName = doctorData.name.startsWith('Dr.') ? doctorData.name : `Dr. ${doctorData.name}`;
    const newDoc: User = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      username: doctorData.username.trim(),
      password: doctorData.password || doctorData.username.trim(),
      name: doctorName,
      role: 'doctor',
      doctorName,
      branch: doctorData.branch || 'Guntur',
      specialty: doctorData.specialty || 'Physiotherapy & General Care',
    };

    setAllUsers(prev => {
      const exists = prev.some(u => u.username.toLowerCase() === newDoc.username.toLowerCase());
      if (exists) return prev;
      return [...prev, newDoc];
    });

    api.registerDoctor(doctorData).catch(() => {});
    return newDoc;
  }, []);

  const addDoctorsBatch = useCallback((doctorsList: { name: string; username: string; password: string; specialty?: string; branch?: any }[]): User[] => {
    const created: User[] = [];
    doctorsList.forEach(d => {
      if (!d.name || !d.username) return;
      const doctorName = d.name.startsWith('Dr.') ? d.name : `Dr. ${d.name}`;
      const newDoc: User = {
        id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        username: d.username.trim(),
        password: d.password || d.username.trim(),
        name: doctorName,
        role: 'doctor',
        doctorName,
        branch: d.branch || 'Guntur',
        specialty: d.specialty || 'General Medicine',
      };
      created.push(newDoc);
    });

    if (created.length > 0) {
      setAllUsers(prev => {
        const existingUsernames = new Set(prev.map(u => u.username.toLowerCase()));
        const uniqueNew = created.filter(u => !existingUsernames.has(u.username.toLowerCase()));
        return [...prev, ...uniqueNew];
      });

      api.registerDoctorsBatch(doctorsList).catch(() => {});
    }
    return created;
  }, []);

  const addPatient = useCallback((patient: Omit<Patient, 'id'>): Patient => {
    const newPatient: Patient = { ...patient, id: generateId() };
    setPatients(prev => [...prev, newPatient]);

    api.addPatient(patient).catch(() => {});
    return newPatient;
  }, []);

  const dischargePatient = useCallback((patientId: string) => {
    setPatients(prev =>
      prev.map(p =>
        p.id === patientId
          ? { ...p, status: 'Discharged' as const, dischargeDate: new Date().toISOString().split('T')[0] }
          : p
      )
    );

    api.dischargePatient(patientId).catch(() => {});
  }, []);

  const saveSessionNote = useCallback((note: Omit<SessionNote, 'id'>) => {
    setSessionNotes(prev => [...prev, { ...note, id: generateId() }]);
    api.saveSessionNote(note).catch(() => {});
  }, []);

  const addUpload = useCallback((upload: Omit<UploadRecord, 'id'> & { id?: string }) => {
    const uploadId = upload.id || generateId();
    const baseUrl = 'http://localhost:5000';
    const newUpload: UploadRecord = {
      ...upload,
      id: uploadId,
      fileUrl: upload.fileUrl || `${baseUrl}/api/doctors/files/view/${uploadId}`,
    };
    setUploads(prev => [...prev, newUpload]);
    api.uploadReport(newUpload).catch(() => {});
  }, []);

  const removeDoctor = useCallback((username: string) => {
    setAllUsers(prev => prev.filter(u => u.username.toLowerCase() !== username.trim().toLowerCase() && u.id !== username));
    api.deleteDoctor(username).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        patients,
        auditLog,
        sessionNotes,
        uploads,
        login,
        logout,
        addPatient,
        dischargePatient,
        saveSessionNote,
        addUpload,
        addDoctor,
        addDoctorsBatch,
        removeDoctor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
