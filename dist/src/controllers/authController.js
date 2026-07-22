"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'medicare_hms_super_secret_jwt_key_2026';
// Seeded users map matching frontend role credentials
const MOCK_USERS = [
    { id: 'u1', username: 'admin', role: 'admin', name: 'Dr. Prasad (HOD)', doctorName: undefined, branch: undefined },
    { id: 'u2', username: 'guntur', role: 'reception', name: 'Receptionist - Guntur', doctorName: undefined, branch: 'Guntur' },
    { id: 'u3', username: 'hyderabad', role: 'reception', name: 'Receptionist - Hyderabad', doctorName: undefined, branch: 'Hyderabad' },
    { id: 'u4', username: 'manish', role: 'doctor', name: 'Dr. Manish', doctorName: 'Dr. Manish', branch: 'Guntur' },
    { id: 'u5', username: 'krupakar', role: 'doctor', name: 'Dr. Krupakar', doctorName: 'Dr. Krupakar', branch: 'Hyderabad' },
];
const login = async (req, res) => {
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
        // Password validation (simple check or mock demo matching username)
        if (password && password !== username) {
            res.status(401).json({ error: 'Invalid password' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role, branch: user.branch }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            message: 'Login successful',
            token,
            user,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = MOCK_USERS.find(u => u.id === decoded.id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.getMe = getMe;
