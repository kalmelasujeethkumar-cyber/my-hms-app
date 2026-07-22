import { Router } from 'express';
import { getPatients, addPatient, dischargePatient } from '../controllers/patientController';

const router = Router();

router.get('/', getPatients);
router.post('/', addPatient);
router.patch('/:id/discharge', dischargePatient);

export default router;
