"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAuditLog = exports.getAuditLogs = void 0;
const AUDIT_LOGS = [
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
const getAuditLogs = async (req, res) => {
    try {
        res.json(AUDIT_LOGS);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAuditLogs = getAuditLogs;
const addAuditLog = async (req, res) => {
    try {
        const entry = req.body;
        if (!entry.user || !entry.action) {
            res.status(400).json({ error: 'user and action are required' });
            return;
        }
        const newLog = {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addAuditLog = addAuditLog;
