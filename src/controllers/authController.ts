import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'medicare_hms_super_secret_jwt_key_2026';

// Seeded users map matching frontend role credentials
const MOCK_USERS = [
  { id: 'u1', username: 'admin', role: 'admin', name: 'Dr. B Vamsi Pavan (HOD)', doctorName: undefined, branch: undefined },
  { id: 'u2', username: 'guntur', role: 'reception', name: 'Receptionist - Guntur', doctorName: undefined, branch: 'Guntur' },
  { id: 'u3', username: 'hyderabad', role: 'reception', name: 'Receptionist - Hyderabad', doctorName: undefined, branch: 'Hyderabad' },
  { id: 'u4', username: 'manish', role: 'doctor', name: 'Dr. Manish', doctorName: 'Dr. Manish', branch: 'Guntur' },
  { id: 'u5', username: 'krupakar', role: 'doctor', name: 'Dr. Krupakar', doctorName: 'Dr. Krupakar', branch: 'Hyderabad' },
];

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username) {
      res.status(400).json({ error: 'Username is required' });
      return;
    }

    const user = MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Password validation (matches user.password, username, or default)
    const expectedPassword = (user as any).password || user.username;
    if (password && password !== expectedPassword && password !== user.username) {
      res.status(401).json({ error: 'Invalid password' });
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
      user,
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

    res.json({ user });
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

    const existing = MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      res.status(400).json({ error: `Username "${username}" is already taken` });
      return;
    }

    const doctorName = name.startsWith('Dr.') ? name : `Dr. ${name}`;
    const newUser = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      username,
      password: password || username,
      name: doctorName,
      role: 'doctor',
      doctorName,
      branch: branch || 'Guntur',
      specialty: specialty || 'General Medicine',
    };

    MOCK_USERS.push(newUser);

    res.status(201).json({
      message: 'Doctor user profile created in database',
      user: newUser,
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

    const added: any[] = [];
    for (const doc of doctors) {
      if (!doc.name || !doc.username) continue;
      const existing = MOCK_USERS.find(u => u.username.toLowerCase() === doc.username.toLowerCase());
      if (existing) continue;

      const doctorName = doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`;
      const newUser = {
        id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        username: doc.username,
        password: doc.password || doc.username,
        name: doctorName,
        role: 'doctor',
        doctorName,
        branch: doc.branch || 'Guntur',
        specialty: doc.specialty || 'Physiotherapy & Rehab',
      };
      MOCK_USERS.push(newUser);
      added.push(newUser);
    }

    res.status(201).json({
      message: `Provisioned ${added.length} doctor account(s) in database`,
      users: added,
      allUsers: MOCK_USERS,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  res.json(MOCK_USERS);
};

export const deleteDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const index = MOCK_USERS.findIndex(
      u => u.username.toLowerCase() === username.toLowerCase() || u.id === username
    );
    if (index !== -1) {
      const removed = MOCK_USERS.splice(index, 1);
      res.json({ message: 'Doctor access revoked successfully', user: removed[0] });
      return;
    }
    res.status(404).json({ error: 'Doctor not found' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

