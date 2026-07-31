"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGPSHistory = exports.postGPSLocation = exports.uploadReport = exports.saveSessionNote = exports.getDoctorStats = void 0;
const DOCTOR_STATS = {
    'Dr. Manish': {
        activePatient: 'Srinivasa Rao',
        homeVisits: 3,
        inHospital: 0,
        totalVisits: 3,
        thisMonth: 18,
        annualTotal: 215,
        monthlyData: [
            { month: 'Jul', home: 14, hospital: 2 },
            { month: 'Aug', home: 16, hospital: 1 },
            { month: 'Sep', home: 12, hospital: 3 },
            { month: 'Oct', home: 20, hospital: 0 },
            { month: 'Nov', home: 15, hospital: 2 },
            { month: 'Dec', home: 18, hospital: 1 },
        ],
    },
    'Dr. Krupakar': {
        activePatient: 'Priya Sharma',
        homeVisits: 2,
        inHospital: 1,
        totalVisits: 3,
        thisMonth: 22,
        annualTotal: 268,
        monthlyData: [
            { month: 'Jul', home: 18, hospital: 4 },
            { month: 'Aug', home: 21, hospital: 3 },
            { month: 'Sep', home: 19, hospital: 5 },
            { month: 'Oct', home: 24, hospital: 2 },
            { month: 'Nov', home: 20, hospital: 4 },
            { month: 'Dec', home: 22, hospital: 3 },
        ],
    },
};
const SESSION_NOTES = [];
const UPLOADS = [];
const GPS_HISTORY = [];
const getDoctorStats = async (req, res) => {
    try {
        const { doctorName } = req.query;
        if (doctorName && typeof doctorName === 'string') {
            const stats = DOCTOR_STATS[doctorName];
            if (!stats) {
                res.status(404).json({ error: 'Doctor stats not found' });
                return;
            }
            res.json(stats);
            return;
        }
        res.json(DOCTOR_STATS);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getDoctorStats = getDoctorStats;
const saveSessionNote = async (req, res) => {
    try {
        const note = req.body;
        if (!note.doctorName || !note.notes) {
            res.status(400).json({ error: 'doctorName and notes are required' });
            return;
        }
        SESSION_NOTES.push(note);
        res.status(201).json({ message: 'Session note saved successfully', note });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.saveSessionNote = saveSessionNote;
const uploadReport = async (req, res) => {
    try {
        const upload = req.body;
        if (!upload.doctorName || !upload.fileName) {
            res.status(400).json({ error: 'doctorName and fileName are required' });
            return;
        }
        UPLOADS.push(upload);
        res.status(201).json({ message: 'Report recorded successfully', upload });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.uploadReport = uploadReport;
const postGPSLocation = async (req, res) => {
    try {
        const gps = req.body;
        if (!gps.doctorName || gps.lat === undefined || gps.lng === undefined) {
            res.status(400).json({ error: 'doctorName, lat, and lng are required' });
            return;
        }
        GPS_HISTORY.unshift(gps);
        res.status(201).json({ message: 'GPS location updated', location: gps });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.postGPSLocation = postGPSLocation;
const getGPSHistory = async (req, res) => {
    try {
        const { doctorName } = req.query;
        if (doctorName && typeof doctorName === 'string') {
            res.json(GPS_HISTORY.filter(g => g.doctorName.toLowerCase() === doctorName.toLowerCase()));
            return;
        }
        res.json(GPS_HISTORY);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getGPSHistory = getGPSHistory;
