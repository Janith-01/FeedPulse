import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../types/response';

/**
 * Placeholder feedback controllers.
 * These will be expanded as the API grows.
 */

export const getAllFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json(successResponse('Feedback list retrieved', []));
  } catch (error: any) {
    res.status(500).json(errorResponse('Failed to retrieve feedback', error.message));
  }
};
