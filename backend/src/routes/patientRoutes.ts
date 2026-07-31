import { Router } from 'express';
import {
  getPatients,
  addPatient,
  dischargePatient,
  getPatientRecordsWithReports,
  exportPatientExcel,
  triggerDailyExport,
} from '../controllers/patientController';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// ── Standard patient routes (accessible to all authenticated roles) ──
router.get('/', getPatients);
router.post('/', addPatient);
router.patch('/:id/discharge', dischargePatient);

// ── Admin-only routes (RBAC: requireAdmin middleware) ──────────────
// GET /api/patients/admin/records        — full patient list with reports
// GET /api/patients/admin/export-excel   — download .xlsx workbook
// POST /api/patients/admin/trigger-export — manually run daily auto-export
router.get('/admin/records', requireAdmin, getPatientRecordsWithReports);
router.get('/admin/export-excel', requireAdmin, exportPatientExcel);
router.post('/admin/trigger-export', requireAdmin, triggerDailyExport);

export default router;
