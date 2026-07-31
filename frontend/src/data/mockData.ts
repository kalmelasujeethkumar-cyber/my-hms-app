/* ============================================================
   VPC-HMS — Seed / Mock Data
   Contains the staff users (3 stakeholders + 2 reception + 2 doctors),
   8 patients (4 per branch), and initial audit log entries.

   SECURITY NOTE:
   - Passwords are stored as SHA-256(password + salt) hex strings.
   - Salts are unique per user (UUID v4).
   - Plain-text `password` field is used ONLY for legacy quick-access
     buttons (reception/doctor UI helpers) — stakeholder passwords are
     NEVER stored or shown in plain text anywhere.
   ============================================================ */

import { User, Patient, AuditEntry, UploadRecord } from '../types';

/** App data version — increment when USERS schema changes to bust stale localStorage */
export const DATA_VERSION = 'vpc-hms-v3';

// ── Staff Users ─────────────────────────────────────────────
// Passwords stored as SHA-256(plaintext + salt). See gen_hashes.js for derivation.
export const USERS: User[] = [
  // ── 3 Stakeholder (Admin-level) Accounts ──────────────────
  {
    id: 'sk1',
    username: '9701115145',
    password: '',                    // never stored in plain text
    passwordHash: '2764fcae7f249e9334e4327f65184563f276d1f2d337c6218b21b5b852305315',
    salt: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Dr. B Vamsi Pavan (HOD)',
    role: 'admin',
  },
  {
    id: 'sk2',
    username: '8179110156',
    password: '',
    passwordHash: 'e2846a44264419f6b80ce19867de16ed4d88cf38b14399493da6c7e8348b5603',
    salt: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    // Display label: Stakeholder 2 | Data key: Dr. Krupakar (Hyderabad)
    name: 'Stakeholder 2',
    role: 'doctor',
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
    name: 'Stakeholder 3',
    role: 'doctor',
    doctorName: 'Dr. Manish',
    branch: 'Guntur',
  },

  // ── Legacy Admin Fallback (kept for backward-compat) ───────
  {
    id: 'u1',
    username: 'admin',
    password: 'admin',
    passwordHash: 'ba1627424416e6c6c8dfa3b50dcbb28b9e2ec1deda9e810ef5a691131cfd6dc7',
    salt: 'b8c9d0e1-f2a3-4567-1234-567890000007',
    name: 'Admin (Legacy)',
    role: 'admin',
  },

  // ── Reception Accounts (UNCHANGED — credentials intact) ────
  {
    id: 'u2',
    username: 'guntur',
    password: 'guntur',              // kept for quick-access button
    passwordHash: '292417fc86ca9af0e52d26ea156b932af614d3fb04fcb9485f92bb027d089166',
    salt: 'd4e5f6a7-b8c9-0123-def0-123456789003',
    name: 'Reception - Guntur',
    role: 'reception',
    branch: 'Guntur',
  },
  {
    id: 'u3',
    username: 'hyderabad',
    password: 'hyderabad',
    passwordHash: '6b51bd6f0e8ab42ef74fdfe1b8a19364fd7c440dac20ccd7153327c480a0efb1',
    salt: 'e5f6a7b8-c9d0-1234-ef01-234567890004',
    name: 'Reception - HYD',
    role: 'reception',
    branch: 'Hyderabad',
  },

  // ── Legacy Doctor Accounts (hidden from quick-access; data keys preserved) ──
  // NOTE: doctorName values are internal data-join keys tied to patient records,
  // DOCTOR_STATS, and upload records. Do NOT rename these without DB migration.
  {
    id: 'u4',
    username: 'manish',
    password: 'manish',
    passwordHash: 'd36cfeb504c707348b2751f5259e745ee11d1a7bbeb42a4c27764187f45c1878',
    salt: 'f6a7b8c9-d0e1-2345-f012-345678900005',
    name: 'Dr. Manish',
    role: 'doctor',
    branch: 'Guntur',
    doctorName: 'Dr. Manish',
  },
  {
    id: 'u5',
    username: 'krupakar',
    password: 'krupakar',
    passwordHash: '4dd82b921eb34d32dd23e9f8fdb45362f11814bc47e4af4dc3df63fa0a3f0131',
    salt: 'a7b8c9d0-e1f2-3456-0123-456789000006',
    name: 'Dr. Krupakar',
    role: 'doctor',
    branch: 'Hyderabad',
    doctorName: 'Dr. Krupakar',
  },
];

// ── Seed Patients (4 Guntur + 4 Hyderabad) ─────────────────
export const INITIAL_PATIENTS: Patient[] = [
  // Guntur Branch — Dr. Manish
  {
    id: 'p1',
    name: 'Ravi Kumar',
    phone: '9876543210',
    issue: 'Hypertension',
    treatment: 'BP Medication',
    entryDate: '2025-11-02',
    dischargeDate: '2025-11-09',
    type: 'Home',
    status: 'Discharged',
    branch: 'Guntur',
    doctor: 'Dr. Manish',
    visitCount: 4,
  },
  {
    id: 'p2',
    name: 'Mohammed Arif',
    phone: '9701234567',
    issue: 'Back Pain',
    treatment: 'Physiotherapy',
    entryDate: '2025-11-10',
    dischargeDate: '2025-11-15',
    type: 'Home',
    status: 'Discharged',
    branch: 'Guntur',
    doctor: 'Dr. Manish',
    visitCount: 3,
  },
  {
    id: 'p3',
    name: 'Venkat Rao',
    phone: '9123456780',
    issue: 'Fever & Cold',
    treatment: 'Antibiotics',
    entryDate: '2025-11-18',
    dischargeDate: '2025-11-20',
    type: 'Home',
    status: 'Discharged',
    branch: 'Guntur',
    doctor: 'Dr. Manish',
    visitCount: 2,
  },
  {
    id: 'p4',
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
  // Hyderabad Branch — Dr. Krupakar
  {
    id: 'p5',
    name: 'Sunita Devi',
    phone: '9845123456',
    issue: 'Diabetes Type 2',
    treatment: 'Insulin Therapy',
    entryDate: '2025-11-05',
    dischargeDate: '2025-11-14',
    type: 'In-Hospital',
    status: 'Discharged',
    branch: 'Hyderabad',
    doctor: 'Dr. Krupakar',
    visitCount: 6,
  },
  {
    id: 'p6',
    name: 'Lakshmi Prasad',
    phone: '9632587410',
    issue: 'Asthma',
    treatment: 'Nebulization',
    entryDate: '2025-11-12',
    dischargeDate: null,
    type: 'In-Hospital',
    status: 'Active',
    branch: 'Hyderabad',
    doctor: 'Dr. Krupakar',
    visitCount: 3,
  },
  {
    id: 'p7',
    name: 'Priya Sharma',
    phone: '9988776655',
    issue: 'Migraine',
    treatment: 'Pain Relief',
    entryDate: '2025-11-20',
    dischargeDate: null,
    type: 'Home',
    status: 'Active',
    branch: 'Hyderabad',
    doctor: 'Dr. Krupakar',
    visitCount: 2,
  },
  {
    id: 'p8',
    name: 'Ananya Singh',
    phone: '9765432100',
    issue: 'Chest Pain',
    treatment: '—',
    entryDate: '2025-12-03',
    dischargeDate: '2025-12-08',
    type: 'In-Hospital',
    status: 'Discharged',
    branch: 'Hyderabad',
    doctor: 'Dr. Krupakar',
    visitCount: 4,
  },
];

// ── Initial Audit Log Entries ──────────────────────────────
export const INITIAL_AUDIT_LOG: AuditEntry[] = [
  {
    id: 'a1',
    staff: 'System',
    action: 'Login',
    timestamp: '2025-12-10 08:00:00',
    ip: '10.0.0.1',
  },
  {
    id: 'a2',
    staff: 'Dr. Manish',
    action: 'Login',
    timestamp: '2025-12-10 08:15:22',
    ip: '192.168.1.45',
  },
  {
    id: 'a3',
    staff: 'Reception - Guntur',
    action: 'Login',
    timestamp: '2025-12-10 08:30:10',
    ip: '192.168.1.12',
  },
  {
    id: 'a4',
    staff: 'Dr. Krupakar',
    action: 'Login',
    timestamp: '2025-12-10 09:00:05',
    ip: '192.168.2.78',
  },
  {
    id: 'a5',
    staff: 'Dr. Manish',
    action: 'Logout',
    timestamp: '2025-12-10 13:45:00',
    ip: '192.168.1.45',
  },
];

// ── Doctor Stats (summary numbers) ─────────────────────────
export const DOCTOR_STATS = {
  'Dr. Manish': {
    thisMonth: 18,
    annualTotal: 215,
    branch: 'Guntur' as const,
    activePatient: 'Rajesh Nair',
    activeIssue: 'Post-Surgery Care',
    activeTreatment: 'Wound Dressing',
    activeVisitNumber: 5,
    // Monthly data for chart (Jun–Nov)
    monthlyData: [
      { month: 'Jun', homeVisits: 12, inHospital: 5 },
      { month: 'Jul', homeVisits: 15, inHospital: 7 },
      { month: 'Aug', homeVisits: 18, inHospital: 6 },
      { month: 'Sep', homeVisits: 20, inHospital: 8 },
      { month: 'Oct', homeVisits: 16, inHospital: 9 },
      { month: 'Nov', homeVisits: 18, inHospital: 7 },
    ],
  },
  'Dr. Krupakar': {
    thisMonth: 16,
    annualTotal: 187,
    branch: 'Hyderabad' as const,
    activePatient: 'Priya Sharma',
    activeIssue: 'Migraine',
    activeTreatment: 'Pain Relief',
    activeVisitNumber: 2,
    monthlyData: [
      { month: 'Jun', homeVisits: 10, inHospital: 8 },
      { month: 'Jul', homeVisits: 12, inHospital: 9 },
      { month: 'Aug', homeVisits: 14, inHospital: 7 },
      { month: 'Sep', homeVisits: 16, inHospital: 10 },
      { month: 'Oct', homeVisits: 13, inHospital: 11 },
      { month: 'Nov', homeVisits: 16, inHospital: 8 },
    ],
  },
};

// ── Initial Medical Uploads ─────────────────────────────────
export const INITIAL_UPLOADS: UploadRecord[] = [
  {
    id: 'up-p1-1',
    patientId: 'p1',
    patientName: 'Srinivasa Rao',
    doctorName: 'Dr. Manish',
    type: 'Blood Report',
    fileName: 'blood_routine_report.pdf',
    timestamp: '2025-10-16T10:30:00.000Z',
    fileUrl: 'http://localhost:5000/api/doctors/files/view/up-p1-1',
  },
  {
    id: 'up-p1-2',
    patientId: 'p1',
    patientName: 'Srinivasa Rao',
    doctorName: 'Dr. Manish',
    type: 'Scan / X-Ray',
    fileName: 'brain_mri_scan.png',
    timestamp: '2025-10-18T14:15:00.000Z',
    fileUrl: 'http://localhost:5000/api/doctors/files/view/up-p1-2',
  },
  {
    id: 'up-p1-3',
    patientId: 'p1',
    patientName: 'Srinivasa Rao',
    doctorName: 'Dr. Manish',
    type: 'Prescription',
    fileName: 'neuro_rehab_rx.pdf',
    timestamp: '2025-10-20T11:00:00.000Z',
    fileUrl: 'http://localhost:5000/api/doctors/files/view/up-p1-3',
  },
  {
    id: 'up-p1-4',
    patientId: 'p1',
    patientName: 'Srinivasa Rao',
    doctorName: 'Dr. Manish',
    type: 'Field Visit Photo',
    fileName: 'mobility_session_photo.jpg',
    timestamp: '2025-10-22T09:45:00.000Z',
    fileUrl: 'http://localhost:5000/api/doctors/files/view/up-p1-4',
  },
  {
    id: 'up-p2-1',
    patientId: 'p2',
    patientName: 'Lakshmi Devi',
    doctorName: 'Dr. Manish',
    type: 'Blood Report',
    fileName: 'arthritic_profile_blood.pdf',
    timestamp: '2025-11-02T11:20:00.000Z',
    fileUrl: 'http://localhost:5000/api/doctors/files/view/up-p2-1',
  },
  {
    id: 'up-p2-2',
    patientId: 'p2',
    patientName: 'Lakshmi Devi',
    doctorName: 'Dr. Manish',
    type: 'Scan / X-Ray',
    fileName: 'knee_joint_xray.png',
    timestamp: '2025-11-03T16:00:00.000Z',
    fileUrl: 'http://localhost:5000/api/doctors/files/view/up-p2-2',
  },
  {
    id: 'up-p2-3',
    patientId: 'p2',
    patientName: 'Lakshmi Devi',
    doctorName: 'Dr. Manish',
    type: 'Prescription',
    fileName: 'joint_physio_rx.pdf',
    timestamp: '2025-11-04T12:30:00.000Z',
    fileUrl: 'http://localhost:5000/api/doctors/files/view/up-p2-3',
  },
  {
    id: 'up-p6-1',
    patientId: 'p6',
    patientName: 'Priya Sharma',
    doctorName: 'Dr. Krupakar',
    type: 'Blood Report',
    fileName: 'cbc_spine_panel.pdf',
    timestamp: '2025-09-21T09:00:00.000Z',
    fileUrl: 'http://localhost:5000/api/doctors/files/view/up-p6-1',
  },
  {
    id: 'up-p6-2',
    patientId: 'p6',
    patientName: 'Priya Sharma',
    doctorName: 'Dr. Krupakar',
    type: 'Scan / X-Ray',
    fileName: 'spine_ct_scan.png',
    timestamp: '2025-09-22T15:30:00.000Z',
    fileUrl: 'http://localhost:5000/api/doctors/files/view/up-p6-2',
  },
  {
    id: 'up-p6-3',
    patientId: 'p6',
    patientName: 'Priya Sharma',
    doctorName: 'Dr. Krupakar',
    type: 'Prescription',
    fileName: 'gait_rehab_rx.pdf',
    timestamp: '2025-09-25T10:15:00.000Z',
    fileUrl: 'http://localhost:5000/api/doctors/files/view/up-p6-3',
  },
  {
    id: 'up-p6-4',
    patientId: 'p6',
    patientName: 'Priya Sharma',
    doctorName: 'Dr. Krupakar',
    type: 'Field Visit Photo',
    fileName: 'gait_training_photo.jpg',
    timestamp: '2025-09-28T14:00:00.000Z',
    fileUrl: 'http://localhost:5000/api/doctors/files/view/up-p6-4',
  },
];
