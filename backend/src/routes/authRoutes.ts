import { Router } from 'express';
import { login, getMe, registerDoctor, registerDoctorsBatch, getUsers, deleteDoctor } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.get('/me', getMe);
router.get('/users', getUsers);
router.post('/register-doctor', registerDoctor);
router.post('/register-doctors-batch', registerDoctorsBatch);
router.delete('/delete-doctor/:username', deleteDoctor);

export default router;
