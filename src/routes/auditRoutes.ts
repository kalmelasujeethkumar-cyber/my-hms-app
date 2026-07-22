import { Router } from 'express';
import { getAuditLogs, addAuditLog } from '../controllers/auditController';

const router = Router();

router.get('/', getAuditLogs);
router.post('/', addAuditLog);

export default router;
