import { Request, Response } from 'express';

interface AuditLogEntry {
  id: string;
  user: string;
  role: string;
  action: 'LOGIN' | 'LOGOUT' | 'PATIENT_CREATE' | 'STATUS_CHANGE';
  timestamp: string;
  ip: string;
  details?: string;
}

const AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'a1',
    user: 'Dr. Prasad (HOD)',
    role: 'Admin',
    action: 'LOGIN',
    timestamp: new Date().toISOString(),
    ip: '192.168.1.100',
    details: 'Logged into Admin Portal',
  },
  {
    id: 'a2',
    user: 'Receptionist - Guntur',
    role: 'Reception',
    action: 'LOGIN',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    ip: '192.168.1.101',
    details: 'Logged into Guntur Reception Desk',
  },
];

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(AUDIT_LOGS);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addAuditLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const entry: AuditLogEntry = req.body;
    if (!entry.user || !entry.action) {
      res.status(400).json({ error: 'user and action are required' });
      return;
    }
    const newLog: AuditLogEntry = {
      id: `a-${Date.now()}`,
      user: entry.user,
      role: entry.role || 'Staff',
      action: entry.action,
      timestamp: entry.timestamp || new Date().toISOString(),
      ip: req.ip || entry.ip || '127.0.0.1',
      details: entry.details,
    };
    AUDIT_LOGS.unshift(newLog);
    res.status(201).json(newLog);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
