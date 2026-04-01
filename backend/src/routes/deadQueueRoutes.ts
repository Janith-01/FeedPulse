import { Router } from 'express';
import { getDeadQueue, retryDeadQueue } from '../controllers/deadQueueController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateJWT, getDeadQueue);
router.post('/retry-all', authenticateJWT, retryDeadQueue);

export default router;
