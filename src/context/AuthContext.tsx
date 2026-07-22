/* ============================================================
   MediCare HMS — Authentication & API Sync Context
   Manages login/logout, patient registry, audit logs, and API sync.
   Connects to Express backend while maintaining local state sync.
   ============================================================ */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Patient, AuditEntry, SessionNote, UploadRecord } from '../types';
import { USERS, INITIAL_PATIENTS, INITIAL_AUDIT_LOG } from '../data/mockData';
import api from '../api/client';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  patients: Patient[];
  auditLog: AuditEntry[];
  sessionNotes: SessionNote[];
  uploads: UploadRecord[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  dischargePatient: (patientId: string) => void;
  saveSessionNote: (note: Omit<SessionNote, 'id'>) => void;
  addUpload: (upload: Omit<UploadRecord, 'id'>) => void;
  addDoctor: (doctorData: { name: string; username: string; password: string; specialty?: string; branch?: any }) => User;
  addDoctorsBatch: (doctorsList: { name: string; username: string; password: string; specialty?: string; branch?: any }[]) => User[];
  removeDoctor: (username: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEYS = {
  USER: 'medicare_current_user',
  ALL_USERS: 'medicare_all_users',
  TOKEN: 'hms_token',
  PATIENTS: 'medicare_patients',
  AUDIT: 'medicare_audit_log',
  NOTES: 'medicare_session_notes',
  UPLOADS: 'medicare_uploads',
} as const;

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getMockIP = () => {
  const octets = [192, 168, Math.floor(Math.random() * 5), Math.floor(Math.random() * 255)];
  return octets.join('.');
};

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
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state with local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(allUsers));
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
            prev.forEach(u => mergedMap.set(u.username.toLowerCase(), u));
            serverUsers.forEach(u => mergedMap.set(u.username.toLowerCase(), u));
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

  const login = useCallback((username: string, password: string): boolean => {
    const user = allUsers.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() &&
           (u.password === password || u.username.toLowerCase() === password.trim().toLowerCase())
    );
    if (user) {
      setCurrentUser(user);
      addAuditEntry(user.name, 'Login');

      // Attempt API login token generation
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

  const addPatient = useCallback((patient: Omit<Patient, 'id'>) => {
    const newPatient: Patient = { ...patient, id: generateId() };
    setPatients(prev => [...prev, newPatient]);

    api.addPatient(patient).catch(() => {});
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

  const addUpload = useCallback((upload: Omit<UploadRecord, 'id'>) => {
    setUploads(prev => [...prev, { ...upload, id: generateId() }]);
    api.uploadReport(upload).catch(() => {});
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
