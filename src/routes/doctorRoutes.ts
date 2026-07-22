import { Router } from 'express';
import {
  getDoctorStats,
  saveSessionNote,
  uploadReport,
  postGPSLocation,
  getGPSHistory,
} from '../controllers/doctorController';

const router = Router();

router.get('/stats', getDoctorStats);
router.post('/sessions/notes', saveSessionNote);
router.post('/reports/upload', uploadReport);
router.post('/gps', postGPSLocation);
router.get('/gps', getGPSHistory);

export default router;
