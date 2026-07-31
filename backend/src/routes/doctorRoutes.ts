import { Router } from 'express';
import {
  getDoctorStats,
  saveSessionNote,
  uploadReport,
  viewFile,
  postGPSLocation,
  getGPSHistory,
} from '../controllers/doctorController';

const router = Router();

router.get('/stats', getDoctorStats);
router.post('/sessions/notes', saveSessionNote);
router.post('/reports/upload', uploadReport);
router.get('/files/view/:id', viewFile);
router.post('/gps', postGPSLocation);
router.get('/gps', getGPSHistory);

export default router;
