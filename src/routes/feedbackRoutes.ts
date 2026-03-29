import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth';
import {
  submitFeedback,
  getAllFeedback,
  getFeedbackById,
  patchFeedbackStatus,
  removeFeedback,
  getFeedbackSummary,
} from '../controllers/feedbackController';

const router = Router();

// ─── Validation Rules ────────────────────────────────────────────────────────

const feedbackValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5 })
    .withMessage('Title must be at least 5 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Bug', 'Feature Request', 'Improvement', 'Other'])
    .withMessage('Invalid category'),
  body('submitterEmail')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('submitterName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
];

// ─── Public Routes ───────────────────────────────────────────────────────────

/**
 * @route   POST /api/feedback
 * @desc    Submit new feedback
 * @access  Public
 */
router.post('/', feedbackValidation, submitFeedback);

// ─── Protected Admin Routes ──────────────────────────────────────────────────

/**
 * @route   GET /api/feedback/summary
 * @desc    Get AI trend summary (last 7 days)
 * @access  Admin
 * @note    Must be ABOVE the /:id route to avoid "summary" being treated as an ID
 */
router.get('/summary', protect, getFeedbackSummary);

/**
 * @route   GET /api/feedback
 * @desc    List all feedback (paginated, sorted, filtered)
 * @access  Admin
 */
router.get('/', protect, getAllFeedback);

/**
 * @route   GET /api/feedback/:id
 * @desc    Get single feedback
 * @access  Admin
 */
router.get('/:id', protect, getFeedbackById);

/**
 * @route   PATCH /api/feedback/:id
 * @desc    Update feedback status
 * @access  Admin
 */
router.patch('/:id', protect, patchFeedbackStatus);

/**
 * @route   DELETE /api/feedback/:id
 * @desc    Delete feedback
 * @access  Admin
 */
router.delete('/:id', protect, removeFeedback);

export default router;
