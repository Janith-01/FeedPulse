import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../types/response';

// ─── Extend Express Request ──────────────────────────────────────────────────

export interface AuthRequest extends Request {
  admin?: { email: string };
}

// ─── JWT Config ──────────────────────────────────────────────────────────────

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
};

// ─── Generate Token ──────────────────────────────────────────────────────────

export const generateToken = (email: string): string => {
  return jwt.sign({ email }, getJwtSecret(), { expiresIn: '24h' });
};

// ─── Auth Middleware ─────────────────────────────────────────────────────────

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(errorResponse('Access denied. No token provided.'));
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as { email: string };

    req.admin = { email: decoded.email };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json(errorResponse('Token expired. Please login again.'));
      return;
    }
    res.status(401).json(errorResponse('Invalid token.'));
  }
};
