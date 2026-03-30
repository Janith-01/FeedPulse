import { Router } from 'express';
import {
  createFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
} from '../controllers/feedbackController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/', createFeedback);

// Protected Admin routes
router.get('/', authenticateJWT, getAllFeedback);
router.get('/:id', authenticateJWT, getFeedbackById);
router.patch('/:id', authenticateJWT, updateFeedbackStatus);
router.delete('/:id', authenticateJWT, deleteFeedback);

export default router;
