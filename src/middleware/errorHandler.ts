import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../types/response';

/**
 * Global error handling middleware.
 * Catches unhandled errors and returns a standardized response.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`❌ Error: ${err.message}`);
  console.error(err.stack);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json(
    errorResponse(
      process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message,
      err.message
    )
  );
};

/**
 * 404 Not Found handler.
 */
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  res.status(404).json(errorResponse(`Route not found: ${req.originalUrl}`));
};
