import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'vpc_hms_super_secret_jwt_key_2026';

// ── SHA-256 + Salt Helper ─────────────────────────────────────────────────────
/**
 * Compute SHA-256(password + salt) — matches the frontend SubtleCrypto implementation.
 * Passwords are NEVER compared or logged in plain text.
 * Case-sensitive: no normalization of password string.
 */
function sha256WithSalt(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

/**
 * Verify a plain-text password against a stored SHA-256+salt hash.
 * Returns true only if the hashes match exactly.
 */
function verifyPassword(plaintext: string, storedHash: string, salt: string): boolean {
  const computed = sha256WithSalt(plaintext, salt);
  return computed === storedHash;
}

// ── User Store ───────────────────────────────────────────────────────────────
// Passwords stored as SHA-256(plaintext + salt) hex strings.
// Plain-text `password` is kept ONLY for legacy reception/doctor quick-access.
// Stakeholder accounts have password: '' — never stored or logged in plain text.
interface StoredUser {
  id: string;
  username: string;
  password: string;        // legacy plain-text (empty for stakeholders)
  passwordHash: string;    // SHA-256(password + salt)
  salt: string;            // per-user UUID salt
  role: string;
  name: string;
  doctorName?: string;
  branch?: string;
  specialty?: string;
}

const MOCK_USERS: StoredUser[] = [
  // ── Stakeholder Accounts (admin-level, mobile number usernames) ──────────
  {
    id: 'sk1',
    username: '9701115145',
    password: '',
    passwordHash: '2764fcae7f249e9334e4327f65184563f276d1f2d337c6218b21b5b852305315',
    salt: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    role: 'admin',
    name: 'Dr. B Vamsi Pavan (HOD)',
  },
  {
    id: 'sk2',
    username: '8179110156',
    password: '',
    passwordHash: 'e2846a44264419f6b80ce19867de16ed4d88cf38b14399493da6c7e8348b5603',
    salt: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    // Display label: Stakeholder 2 | Data key: Dr. Krupakar (Hyderabad)
    role: 'doctor',
    name: 'Stakeholder 2',
    doctorName: 'Dr. Krupakar',
    branch: 'Hyderabad',
  },
  {
    id: 'sk3',
    username: '9160400851',
    password: '',
    passwordHash: 'e4c29ca41d997a550e8f2437dd890f7c448f9185429ef272e87243fbf2e71a23',
    salt: 'c3d4e5f6-a7b8-9012-cdef-012345678902',
    // Display label: Stakeholder 3 | Data key: Dr. Manish (Guntur)
    role: 'doctor',
    name: 'Stakeholder 3',
    doctorName: 'Dr. Manish',
    branch: 'Guntur',
  },

  // ── Legacy Admin Fallback ────────────────────────────────────────────────
  {
    id: 'u1',
    username: 'admin',
    password: '',
    passwordHash: 'ba1627424416e6c6c8dfa3b50dcbb28b9e2ec1deda9e810ef5a691131cfd6dc7',
    salt: 'b8c9d0e1-f2a3-4567-1234-567890000007',
    role: 'admin',
    name: 'Admin (Legacy)',
  },

  // ── Reception Accounts (UNCHANGED — credentials, dashboard, permissions intact) ──
  {
    id: 'u2',
    username: 'guntur',
    password: 'guntur',
    passwordHash: '292417fc86ca9af0e52d26ea156b932af614d3fb04fcb9485f92bb027d089166',
    salt: 'd4e5f6a7-b8c9-0123-def0-123456789003',
    role: 'reception',
    name: 'Reception - Guntur',
    branch: 'Guntur',
  },
  {
    id: 'u3',
    username: 'hyderabad',
    password: 'hyderabad',
    passwordHash: '6b51bd6f0e8ab42ef74fdfe1b8a19364fd7c440dac20ccd7153327c480a0efb1',
    salt: 'e5f6a7b8-c9d0-1234-ef01-234567890004',
    role: 'reception',
    name: 'Reception - HYD',
    branch: 'Hyderabad',
  },

  // ── Doctor Accounts ──────────────────────────────────────────────────────
  {
    id: 'u4',
    username: 'manish',
    password: 'manish',
    passwordHash: 'd36cfeb504c707348b2751f5259e745ee11d1a7bbeb42a4c27764187f45c1878',
    salt: 'f6a7b8c9-d0e1-2345-f012-345678900005',
    role: 'doctor',
    name: 'Dr. Manish',
    doctorName: 'Dr. Manish',
    branch: 'Guntur',
  },
  {
    id: 'u5',
    username: 'krupakar',
    password: 'krupakar',
    passwordHash: '4dd82b921eb34d32dd23e9f8fdb45362f11814bc47e4af4dc3df63fa0a3f0131',
    salt: 'a7b8c9d0-e1f2-3456-0123-456789000006',
    role: 'doctor',
    name: 'Dr. Krupakar',
    doctorName: 'Dr. Krupakar',
    branch: 'Hyderabad',
  },
];

// ── Helper: safe user object (strips sensitive fields before sending to client) ──
function safeUser(u: StoredUser) {
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    name: u.name,
    doctorName: u.doctorName,
    branch: u.branch,
    specialty: u.specialty,
  };
}

// ── Controllers ───────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // ── Server-side: Username must be present ────────────────────────────────
    if (!username) {
      res.status(400).json({ error: 'Username is required' });
      return;
    }

    // ── Server-side: Numeric username validation (for stakeholder mobile numbers) ──
    // Allow text usernames for reception/doctor accounts (backward-compat).
    // Reject usernames that contain non-numeric chars AND are not known text accounts.
    const isNumericUsername = /^\d{10}$/.test(String(username));
    const isKnownTextUsername = /^[a-zA-Z]+$/.test(String(username));
    if (!isNumericUsername && !isKnownTextUsername) {
      res.status(400).json({
        error: 'Invalid username format. Use a 10-digit mobile number or a valid text username.',
      });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    // ── Find user (exact match for numeric, case-insensitive for text) ───────
    const user = MOCK_USERS.find(u =>
      isNumericUsername
        ? u.username === String(username)                          // exact match for mobile numbers
        : u.username.toLowerCase() === String(username).toLowerCase() // case-insensitive for text
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // ── Password verification: SHA-256+salt (case-sensitive) ─────────────────
    // No toLowerCase/toUpperCase on password — verified exactly as entered.
    let authenticated = verifyPassword(String(password), user.passwordHash, user.salt);

    // Legacy fallback for reception/doctor plain-text passwords
    if (!authenticated && user.password && user.password.length > 0) {
      authenticated = String(password) === user.password;
    }

    if (!authenticated) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, branch: user.branch },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: safeUser(user),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = MOCK_USERS.find(u => u.id === decoded.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: safeUser(user) });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const registerDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, specialty, username, password, branch } = req.body;
    if (!username || !name) {
      res.status(400).json({ error: 'Name and username are required' });
      return;
    }

    const existing = MOCK_USERS.find(u => u.username.toLowerCase() === String(username).toLowerCase());
    if (existing) {
      res.status(400).json({ error: `Username "${username}" is already taken` });
      return;
    }

    const doctorName = name.startsWith('Dr.') ? name : `Dr. ${name}`;
    const plainPassword = password || String(username);
    // Generate a salt for the new doctor
    const newSalt = crypto.randomUUID();
    const newHash = sha256WithSalt(plainPassword, newSalt);

    const newUser: StoredUser = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      username: String(username),
      password: plainPassword,      // kept for doctor quick-access
      passwordHash: newHash,
      salt: newSalt,
      name: doctorName,
      role: 'doctor',
      doctorName,
      branch: branch || 'Guntur',
      specialty: specialty || 'General Medicine',
    };

    MOCK_USERS.push(newUser);

    res.status(201).json({
      message: 'Doctor user profile created in database',
      user: safeUser(newUser),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const registerDoctorsBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctors } = req.body;
    if (!Array.isArray(doctors) || doctors.length === 0) {
      res.status(400).json({ error: 'Doctors list is required' });
      return;
    }

    const added: ReturnType<typeof safeUser>[] = [];
    for (const doc of doctors) {
      if (!doc.name || !doc.username) continue;
      const existing = MOCK_USERS.find(u => u.username.toLowerCase() === String(doc.username).toLowerCase());
      if (existing) continue;

      const doctorName = doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`;
      const plainPassword = doc.password || String(doc.username);
      const newSalt = crypto.randomUUID();
      const newHash = sha256WithSalt(plainPassword, newSalt);

      const newUser: StoredUser = {
        id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        username: String(doc.username),
        password: plainPassword,
        passwordHash: newHash,
        salt: newSalt,
        name: doctorName,
        role: 'doctor',
        doctorName,
        branch: doc.branch || 'Guntur',
        specialty: doc.specialty || 'Physiotherapy & Rehab',
      };
      MOCK_USERS.push(newUser);
      added.push(safeUser(newUser));
    }

    res.status(201).json({
      message: `Provisioned ${added.length} doctor account(s) in database`,
      users: added,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  // Return safe user objects — no password hashes or salts exposed via API
  res.json(MOCK_USERS.map(safeUser));
};

export const deleteDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const index = MOCK_USERS.findIndex(
      u => u.username.toLowerCase() === String(username).toLowerCase() || u.id === username
    );
    if (index !== -1) {
      const removed = MOCK_USERS.splice(index, 1);
      res.json({ message: 'Doctor access revoked successfully', user: safeUser(removed[0]) });
      return;
    }
    res.status(404).json({ error: 'Doctor not found' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
