import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendResponse } from '../utils/responseHelper';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err: any, decoded: any) => {
      if (err) {
        return sendResponse(res, 403, false, null, 'Forbidden', 'Invalid or expired token');
      }

      req.user = decoded;
      next();
    });
  } else {
    sendResponse(res, 401, false, null, 'Unauthorized', 'Authorization header missing');
  }
};
