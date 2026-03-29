import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { successResponse, errorResponse } from '../types/response';
import {
  createFeedback,
  findAllFeedback,
  findFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
  findRecentFeedback,
  FeedbackQuery,
} from '../services/feedbackService';
import { summariseTrends } from '../services/gemini.service';

// ─── Create Feedback ─────────────────────────────────────────────────────────

/**
 * @desc    Submit new feedback (public)
 * @route   POST /api/feedback
 */
export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(
        errorResponse('Validation failed', errors.array().map((e) => e.msg).join(', '))
      );
      return;
    }

    const { title, description, category, submitterName, submitterEmail } = req.body;

    const feedback = await createFeedback({
      title,
      description,
      category,
      submitterName,
      submitterEmail,
    });

    res.status(201).json(successResponse('Feedback submitted successfully', feedback));
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json(errorResponse('Validation failed', messages.join(', ')));
      return;
    }
    res.status(500).json(errorResponse('Failed to submit feedback', error.message));
  }
};

// ─── Get All Feedback ────────────────────────────────────────────────────────

/**
 * @desc    List feedback with pagination, sorting, filtering (admin)
 * @route   GET /api/feedback
 */
export const getAllFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const query: FeedbackQuery = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort: (req.query.sort as string) || 'date',
      order: (req.query.order as 'asc' | 'desc') || 'desc',
      category: req.query.category as string,
      status: req.query.status as string,
      sentiment: req.query.sentiment as string,
    };

    const result = await findAllFeedback(query);

    res.status(200).json(successResponse('Feedback retrieved', result));
  } catch (error: any) {
    res.status(500).json(errorResponse('Failed to retrieve feedback', error.message));
  }
};

// ─── Get Single Feedback ─────────────────────────────────────────────────────

/**
 * @desc    Get feedback by ID (admin)
 * @route   GET /api/feedback/:id
 */
export const getFeedbackById = async (req: Request, res: Response): Promise<void> => {
  try {
    const feedback = await findFeedbackById(req.params.id as string);

    if (!feedback) {
      res.status(404).json(errorResponse('Feedback not found'));
      return;
    }

    res.status(200).json(successResponse('Feedback retrieved', feedback));
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json(errorResponse('Invalid feedback ID format'));
      return;
    }
    res.status(500).json(errorResponse('Failed to retrieve feedback', error.message));
  }
};

// ─── Update Feedback Status ──────────────────────────────────────────────────

/**
 * @desc    Update feedback status (admin)
 * @route   PATCH /api/feedback/:id
 */
export const patchFeedbackStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    if (!status) {
      res.status(400).json(errorResponse('Status is required'));
      return;
    }

    const validStatuses = ['New', 'In Review', 'Resolved'];
    if (!validStatuses.includes(status)) {
      res.status(400).json(
        errorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
      );
      return;
    }

    const feedback = await updateFeedbackStatus(req.params.id as string, status);

    if (!feedback) {
      res.status(404).json(errorResponse('Feedback not found'));
      return;
    }

    res.status(200).json(successResponse('Feedback status updated', feedback));
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json(errorResponse('Invalid feedback ID format'));
      return;
    }
    res.status(500).json(errorResponse('Failed to update feedback', error.message));
  }
};

// ─── Delete Feedback ─────────────────────────────────────────────────────────

/**
 * @desc    Delete feedback (admin)
 * @route   DELETE /api/feedback/:id
 */
export const removeFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const feedback = await deleteFeedback(req.params.id as string);

    if (!feedback) {
      res.status(404).json(errorResponse('Feedback not found'));
      return;
    }

    res.status(200).json(successResponse('Feedback deleted successfully'));
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json(errorResponse('Invalid feedback ID format'));
      return;
    }
    res.status(500).json(errorResponse('Failed to delete feedback', error.message));
  }
};

// ─── Feedback Summary ────────────────────────────────────────────────────────

/**
 * @desc    Generate AI trend summary of last 7 days (admin)
 * @route   GET /api/feedback/summary
 */
export const getFeedbackSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const recentFeedback = await findRecentFeedback();

    const summary = await summariseTrends(
      recentFeedback.map((f) => ({
        title: f.title,
        description: f.description,
        ai_category: f.ai_category,
        ai_sentiment: f.ai_sentiment,
      }))
    );

    if (!summary) {
      res.status(500).json(errorResponse('Failed to generate trend summary'));
      return;
    }

    res.status(200).json(
      successResponse('Trend summary generated', {
        period: 'Last 7 days',
        totalFeedback: recentFeedback.length,
        summary,
      })
    );
  } catch (error: any) {
    res.status(500).json(errorResponse('Failed to generate summary', error.message));
  }
};
