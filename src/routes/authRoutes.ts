import { Router } from 'express';
import { login } from '../controllers/authController';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin user
 * @access  Public
 */
router.post('/login', login);

export default router;
