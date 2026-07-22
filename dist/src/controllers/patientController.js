"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dischargePatient = exports.addPatient = exports.getPatients = void 0;
// In-memory patient store initialized with initial seed data
let PATIENTS = [
    {
        id: 'p1',
        name: 'Srinivasa Rao',
        phone: '9848012345',
        issue: 'Stroke Rehabilitation',
        treatment: 'Physical Therapy & Mobility Training',
        entryDate: '2025-10-15',
        dischargeDate: null,
        type: 'Home',
        status: 'Active',
        branch: 'Guntur',
        doctor: 'Dr. Manish',
        visitCount: 14,
    },
    {
        id: 'p2',
        name: 'Lakshmi Devi',
        phone: '9848023456',
        issue: 'Knee Osteoarthritis',
        treatment: 'Joint Mobilization & Electrotherapy',
        entryDate: '2025-11-01',
        dischargeDate: null,
        type: 'Home',
        status: 'Active',
        branch: 'Guntur',
        doctor: 'Dr. Manish',
        visitCount: 8,
    },
    {
        id: 'p3',
        name: 'Mohammed Ali',
        phone: '9701234567',
        issue: 'Back Pain',
        treatment: 'Physiotherapy',
        entryDate: '2025-11-10',
        dischargeDate: '2025-12-01',
        type: 'Home',
        status: 'Discharged',
        branch: 'Guntur',
        doctor: 'Dr. Manish',
        visitCount: 6,
    },
    {
        id: 'p4',
        name: 'Venkat Rao',
        phone: '9123456780',
        issue: 'Fever & Cold',
        treatment: 'Antibiotics',
        entryDate: '2025-11-18',
        dischargeDate: '2025-11-25',
        type: 'Home',
        status: 'Discharged',
        branch: 'Guntur',
        doctor: 'Dr. Manish',
        visitCount: 3,
    },
    {
        id: 'p5',
        name: 'Rajesh Nair',
        phone: '9871234560',
        issue: 'Post-Surgery Care',
        treatment: 'Wound Dressing',
        entryDate: '2025-12-01',
        dischargeDate: null,
        type: 'Home',
        status: 'Active',
        branch: 'Guntur',
        doctor: 'Dr. Manish',
        visitCount: 5,
    },
    {
        id: 'p6',
        name: 'Priya Sharma',
        phone: '9949012345',
        issue: 'Spinal Cord Injury',
        treatment: 'Neurological Rehab & Gait Training',
        entryDate: '2025-09-20',
        dischargeDate: null,
        type: 'Home',
        status: 'Active',
        branch: 'Hyderabad',
        doctor: 'Dr. Krupakar',
        visitCount: 22,
    },
    {
        id: 'p7',
        name: 'K. Rama Krishna',
        phone: '9949023456',
        issue: 'Frozen Shoulder',
        treatment: 'Manual Therapy & Hydrotherapy',
        entryDate: '2025-11-05',
        dischargeDate: null,
        type: 'Home',
        status: 'Active',
        branch: 'Hyderabad',
        doctor: 'Dr. Krupakar',
        visitCount: 10,
    },
    {
        id: 'p8',
        name: 'Anitha Reddy',
        phone: '9440123456',
        issue: 'Cerebral Palsy Care',
        treatment: 'Pediatric Physiotherapy',
        entryDate: '2025-10-01',
        dischargeDate: null,
        type: 'In-Hospital',
        status: 'Active',
        branch: 'Hyderabad',
        doctor: 'Dr. Krupakar',
        visitCount: 18,
    },
];
const getPatients = async (req, res) => {
    try {
        const { branch, doctor, status } = req.query;
        let result = [...PATIENTS];
        if (branch && typeof branch === 'string') {
            result = result.filter(p => p.branch.toLowerCase() === branch.toLowerCase());
        }
        if (doctor && typeof doctor === 'string') {
            result = result.filter(p => p.doctor.toLowerCase() === doctor.toLowerCase());
        }
        if (status && typeof status === 'string') {
            result = result.filter(p => p.status.toLowerCase() === status.toLowerCase());
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPatients = getPatients;
const addPatient = async (req, res) => {
    try {
        const newPatientData = req.body;
        if (!newPatientData.name || !newPatientData.issue) {
            res.status(400).json({ error: 'Name and issue are required' });
            return;
        }
        const newPatient = {
            id: `p-${Date.now()}`,
            name: newPatientData.name,
            phone: newPatientData.phone || '',
            issue: newPatientData.issue,
            treatment: newPatientData.treatment || '—',
            entryDate: newPatientData.entryDate || new Date().toISOString().split('T')[0],
            dischargeDate: null,
            type: newPatientData.type || 'Home',
            status: 'Active',
            branch: newPatientData.branch || 'Guntur',
            doctor: newPatientData.doctor || 'Dr. Manish',
            visitCount: newPatientData.visitCount || 1,
        };
        PATIENTS.unshift(newPatient);
        res.status(201).json(newPatient);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addPatient = addPatient;
const dischargePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patientIndex = PATIENTS.findIndex(p => p.id === id);
        if (patientIndex === -1) {
            res.status(404).json({ error: 'Patient not found' });
            return;
        }
        PATIENTS[patientIndex].status = 'Discharged';
        PATIENTS[patientIndex].dischargeDate = new Date().toISOString().split('T')[0];
        res.json(PATIENTS[patientIndex]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.dischargePatient = dischargePatient;
