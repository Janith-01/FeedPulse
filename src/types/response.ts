/**
 * Standard API response envelope.
 * All endpoints return responses in this format.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | null;
  message: string;
}

/**
 * Helper to create a success response object.
 */
export const successResponse = <T>(message: string, data?: T): ApiResponse<T> => ({
  success: true,
  data,
  error: null,
  message,
});

/**
 * Helper to create an error response object.
 */
export const errorResponse = (message: string, error?: string): ApiResponse => ({
  success: false,
  data: null,
  error: error || message,
  message,
});
