import { Request, Response } from 'express';
import { generateToken } from '../middleware/auth';
import { successResponse, errorResponse } from '../types/response';

/**
 * @desc    Authenticate admin and return JWT
 * @route   POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json(errorResponse('Email and password are required'));
      return;
    }

    // Check against hardcoded admin credentials from .env
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      res.status(500).json(errorResponse('Admin credentials not configured on server'));
      return;
    }

    if (email !== adminEmail || password !== adminPassword) {
      res.status(401).json(errorResponse('Invalid email or password'));
      return;
    }

    // Generate JWT
    const token = generateToken(email);

    res.status(200).json(
      successResponse('Login successful', {
        token,
        admin: { email },
      })
    );
  } catch (error: any) {
    res.status(500).json(errorResponse('Login failed', error.message));
  }
};
