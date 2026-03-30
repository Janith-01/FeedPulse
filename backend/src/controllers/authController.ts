import { type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { sendResponse } from '../utils/responseHelper';

export const loginAdmin = (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendResponse(res, 400, false, null, 'Email and password are required', 'Bad Request');
  }

  // Validate admin credentials from .env
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    return sendResponse(res, 200, true, { token }, 'Login successful');
  }

  return sendResponse(res, 401, false, null, 'Invalid email or password', 'Unauthorized');
};
