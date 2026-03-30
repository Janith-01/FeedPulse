import { Response } from 'express';

export const sendResponse = (
  res: Response,
  statusCode: number,
  success: boolean,
  data: any = null,
  message: string = '',
  error: string | null = null
) => {
  return res.status(statusCode).json({
    success,
    data,
    error,
    message,
  });
};
