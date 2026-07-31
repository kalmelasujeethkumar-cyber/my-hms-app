/* ============================================================
   VPC-HMS — TypeScript Type Definitions
   All shared interfaces used across the application.
   ============================================================ */

/** Supported user roles in the system */
export type UserRole = 'admin' | 'reception' | 'doctor';

/** The two clinic branches */
export type Branch = 'Guntur' | 'Hyderabad';

/** Patient visit type */
export type VisitType = 'Home' | 'In-Hospital';

/** Patient status lifecycle */
export type PatientStatus = 'Active' | 'Discharged';

/** Audit log action type */
export type AuditAction = 'Login' | 'Logout';

/** Staff/user account — maps to the staff roles */
export interface User {
  id: string;
  username: string;
  /** @deprecated Use passwordHash + salt instead. Kept for legacy quick-access buttons only. */
  password: string;
  /** SHA-256 hex digest of (password + salt). Used for secure auth comparison. */
  passwordHash?: string;
  /** Per-user UUID salt combined with password before hashing. */
  salt?: string;
  name: string;
  role: UserRole;
  branch?: Branch;
  /** For doctor role, the doctor's display name */
  doctorName?: string;
  specialty?: string;
}

/** A patient record */
export interface Patient {
  id: string;
  name: string;
  phone: string;
  issue: string;
  treatment: string;
  entryDate: string;
  dischargeDate: string | null;
  type: VisitType;
  status: PatientStatus;
  branch: Branch;
  doctor: string;
  photo?: string;
  visitCount: number;
}

/** An entry in the audit log (login/logout events) */
export interface AuditEntry {
  id: string;
  staff: string;
  action: AuditAction;
  timestamp: string;
  ip: string;
}

/** A single GPS coordinate point */
export interface GPSLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
  patient?: string;
  location?: string;
}

/** Doctor session notes saved after a treatment session */
export interface SessionNote {
  id: string;
  doctorName: string;
  patientName: string;
  notes: string;
  durationSeconds: number;
  timestamp: string;
}

/** Uploaded medical report/file */
export interface UploadRecord {
  id: string;
  patientId?: string;
  doctorName: string;
  patientName: string;
  type: 'Blood Report' | 'Scan / X-Ray' | 'Prescription' | 'Field Visit Photo';
  fileName: string;
  timestamp: string;
  /** Direct URL to the file (e.g. http://localhost:5000/api/doctors/files/view/:id) */
  fileUrl?: string | null;
  /** Base64 Data URL or file binary content */
  fileData?: string | null;
}

/** Report stub as returned by the admin /records endpoint */
export interface ReportRecord {
  id?: string;
  patientId?: string;
  type: UploadRecord['type'];
  fileName: string;
  doctorName: string;
  timestamp: string;
  fileUrl: string | null;
  fileData?: string | null;
}

/** Patient record enriched with reports — shape returned by GET /api/patients/admin/records */
export interface PatientWithReports extends Patient {
  reports: ReportRecord[];
}

