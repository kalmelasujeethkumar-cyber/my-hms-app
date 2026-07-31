import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { UPLOADS } from './doctorController';


export interface PatientRecord {
  id: string;
  name: string;
  phone: string;
  issue: string;
  treatment: string;
  entryDate: string;
  dischargeDate: string | null;
  type: 'Home' | 'In-Hospital';
  status: 'Active' | 'Discharged';
  branch: 'Guntur' | 'Hyderabad';
  doctor: 'Dr. Manish' | 'Dr. Krupakar';
  visitCount: number;
}

// In-memory patient store initialized with initial seed data
let PATIENTS: PatientRecord[] = [
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

export const getPatients = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const newPatientData = req.body;
    if (!newPatientData.name || !newPatientData.issue) {
      res.status(400).json({ error: 'Name and issue are required' });
      return;
    }

    if (!newPatientData.phone || !/^\d{10}$/.test(String(newPatientData.phone).trim())) {
      res.status(400).json({ error: 'Mobile number must be exactly 10 digits' });
      return;
    }

    const newPatient: PatientRecord = {
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const dischargePatient = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/* ============================================================
   ADMIN-ONLY CONTROLLERS
   Protected by requireAdmin middleware in patientRoutes.ts
   ============================================================ */

/**
 * GET /api/patients/admin/records
 * Returns all patient records enriched with their associated
 * medical report uploads (joined by patient name).
 * Role: admin only (enforced by requireAdmin middleware).
 */
export const getPatientRecordsWithReports = async (
  req: Request,
  res: Response
): Promise<void> => {
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

    // Join each patient with their uploaded reports (matched by patientId or patient name)
    const enriched = result.map(patient => {
      const reports = UPLOADS.filter(
        u => (u.patientId && u.patientId === patient.id) ||
             (u.patientName && u.patientName.toLowerCase() === patient.name.toLowerCase())
      ).map(u => {
        const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
        const fileUrl = (u as any).fileUrl || `${baseUrl}/api/doctors/files/view/${u.id || 'temp'}`;
        return {
          id: u.id,
          patientId: u.patientId || patient.id,
          type: u.type,
          fileName: u.fileName,
          doctorName: u.doctorName,
          timestamp: u.timestamp,
          fileUrl,
          fileData: u.fileData || null,
        };
      });

      return { ...patient, reports };
    });

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/patients/admin/export-excel
 * Generates and streams a real .xlsx workbook containing all patient
 * records with a "Reports" column listing direct clickable report URLs.
 * Role: admin only (enforced by requireAdmin middleware).
 */
/**
 * Generates the Excel workbook buffer containing all patient records.
 * Reusable by both HTTP routes and the server-side auto-export scheduler.
 */
export const generatePatientExcelBuffer = (): Buffer => {
  const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;

  // Build worksheet rows — join patients with their reports accurately
  const worksheetData = PATIENTS.map(patient => {
    const patientUploads = UPLOADS.filter(
      u => (u.patientId && u.patientId === patient.id) ||
           (u.patientName && u.patientName.toLowerCase() === patient.name.toLowerCase())
    );

    const reportsCell = patientUploads.length > 0
      ? patientUploads
          .map((u, i) => {
            const url = (u as any).fileUrl || `${baseUrl}/api/doctors/files/view/${u.id}`;
            return `${i + 1}. ${u.type} (${u.fileName}): ${url}`;
          })
          .join(' | ')
      : 'No reports uploaded';

    return {
      'Patient Name': patient.name,
      'Phone': patient.phone,
      'Health Issue / Diagnosis': patient.issue,
      'Treatment': patient.treatment,
      'Branch': patient.branch,
      'Doctor': patient.doctor,
      'Visit Type': patient.type,
      'Date of Admission': patient.entryDate,
      'Discharge Date': patient.dischargeDate || 'Still Active',
      'Status': patient.status,
      'Visit Count': patient.visitCount,
      'Reports (File / URL)': reportsCell,
    };
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // Auto-size columns for readability
  worksheet['!cols'] = [
    { wch: 22 }, // Patient Name
    { wch: 14 }, // Phone
    { wch: 28 }, // Health Issue
    { wch: 28 }, // Treatment
    { wch: 12 }, // Branch
    { wch: 16 }, // Doctor
    { wch: 14 }, // Visit Type
    { wch: 18 }, // Date of Admission
    { wch: 18 }, // Discharge Date
    { wch: 12 }, // Status
    { wch: 12 }, // Visit Count
    { wch: 60 }, // Reports
  ];

  // Add clickable hyperlinks for Report cells in XLSX
  if (worksheet['!ref']) {
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: 11 }); // Column 11 is Reports
      const cell = worksheet[cellAddress];
      if (cell && cell.v && typeof cell.v === 'string' && cell.v.startsWith('http')) {
        const firstUrl = cell.v.split(' | ')[0];
        cell.l = { Target: firstUrl, Tooltip: 'Click to view report file directly' };
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Patient Records');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * GET /api/patients/admin/export-excel
 * Generates and streams a real .xlsx workbook containing all patient
 * records with a "Reports" column listing direct clickable report URLs.
 * Role: admin only (enforced by requireAdmin middleware).
 */
export const exportPatientExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const buffer = generatePatientExcelBuffer();
    const fileName = `VPC-HMS_PatientRecords_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Returns the total count of patients in the memory store.
 */
export const getPatientCount = (): number => {
  return PATIENTS.length;
};

/**
 * POST /api/patients/admin/trigger-export
 * Manually triggers the scheduled daily backup job.
 * Role: admin only (enforced by requireAdmin middleware).
 */
export const triggerDailyExport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Dynamically import runExportJob to avoid circular dependency loop
    const { runExportJob } = require('../config/schedulerService');
    const result = await runExportJob();

    if (result.success) {
      res.json({
        message: 'Manual trigger of daily auto-export completed successfully.',
        filePath: result.filePath,
        recordCount: result.recordCount,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({ error: result.error || 'Scheduled export task failed.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};




