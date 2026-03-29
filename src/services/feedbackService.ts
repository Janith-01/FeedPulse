import Feedback, { IFeedback } from '../models/Feedback';

/**
 * Placeholder feedback service layer.
 * Business logic for feedback operations will be implemented here.
 */

export const findAllFeedback = async (): Promise<IFeedback[]> => {
  return Feedback.find().sort({ createdAt: -1 });
};
