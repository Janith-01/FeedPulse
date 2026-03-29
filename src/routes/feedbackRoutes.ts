import { Router } from 'express';
import { getAllFeedback } from '../controllers/feedbackController';

const router = Router();

/**
 * @route   GET /api/feedback
 * @desc    Get all feedback
 */
router.get('/', getAllFeedback);

export default router;
