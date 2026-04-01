import { type Request, type Response } from 'express';
import Feedback, { IFeedback } from '../models/Feedback';
import { sendResponse } from '../utils/responseHelper';
import { analyzeFeedback, generateThemeSummary } from '../services/gemini.service';

// Submit new feedback (Public)
export const createFeedback = async (req: Request, res: Response) => {
  try {
    const { title, description, category, submitterName, submitterEmail } = req.body;

    // Manual input sanitization
    if (!title || typeof title !== 'string' || title.length > 120) {
      return sendResponse(res, 400, false, null, 'Title must be a string up to 120 characters', 'Bad Request');
    }

    if (!description || typeof description !== 'string' || description.length < 20) {
      return sendResponse(res, 400, false, null, 'Description must be at least 20 characters', 'Bad Request');
    }

    const validCategories = ['Bug', 'Feature Request', 'Improvement', 'Other'];
    if (!category || !validCategories.includes(category)) {
      return sendResponse(res, 400, false, null, 'Invalid category selected', 'Bad Request');
    }

    // Email validation
    if (submitterEmail && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(submitterEmail)) {
      return sendResponse(res, 400, false, null, 'Invalid email format provided', 'Bad Request');
    }

    const newFeedback = new Feedback({
      title,
      description,
      category,
      submitterName,
      submitterEmail,
    });

    const savedFeedback = await newFeedback.save();

    // Trigger AI Analysis in the background (Non-blocking for final response)
    analyzeFeedback(title, description)
      .then(async (aiData) => {
        if (aiData) {
          await Feedback.findByIdAndUpdate(savedFeedback._id, {
            ai_category: aiData.category,
            ai_sentiment: aiData.sentiment,
            ai_priority: aiData.priority_score,
            ai_summary: aiData.summary,
            ai_tags: aiData.tags,
            ai_processed: true,
            ai_last_error: null,
          });
        } else {
          // null return — either circuit breaker is open or Gemini failed
          await Feedback.findByIdAndUpdate(savedFeedback._id, {
            ai_last_error: 'AI service unavailable',
          });
        }
      })
      .catch((err) => {
        console.error('Background AI processing failed:', err);
        Feedback.findByIdAndUpdate(savedFeedback._id, {
          ai_last_error: err.message || 'Unknown AI processing error',
        }).catch(() => {});
      });

    return sendResponse(res, 201, true, savedFeedback, 'Feedback submitted successfully');
  } catch (error: any) {
    return sendResponse(res, 500, false, null, 'Error saving feedback', error.message);
  }
};

// Get all feedback with pagination and filters (Admin)
export const getAllFeedback = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const filters: any = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.category) {
      filters.category = req.query.category;
    }

    const feedbackItems = await Feedback.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Feedback.countDocuments(filters);

    return sendResponse(res, 200, true, {
      items: feedbackItems,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    }, 'Feedback items retrieved');
  } catch (error: any) {
    return sendResponse(res, 500, false, null, 'Error fetching feedback list', error.message);
  }
};

// Get single feedback by ID (Admin)
export const getFeedbackById = async (req: Request, res: Response) => {
  try {
    const feedbackItem = await Feedback.findById(req.params.id);
    if (!feedbackItem) {
      return sendResponse(res, 404, false, null, 'Feedback item not found', 'Not Found');
    }

    return sendResponse(res, 200, true, feedbackItem, 'Feedback item retrieved');
  } catch (error: any) {
    return sendResponse(res, 500, false, null, 'Error retrieving feedback item', error.message);
  }
};

// Update feedback status (Admin)
export const updateFeedbackStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['New', 'In Review', 'Resolved'];

    if (!status || !validStatuses.includes(status)) {
      return sendResponse(res, 400, false, null, 'Invalid status update', 'Bad Request');
    }

    const updatedItem = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return sendResponse(res, 404, false, null, 'Feedback item not found for update', 'Not Found');
    }

    return sendResponse(res, 200, true, updatedItem, 'Feedback status updated');
  } catch (error: any) {
    return sendResponse(res, 500, false, null, 'Error updating status', error.message);
  }
};

// Delete feedback item (Admin)
export const deleteFeedback = async (req: Request, res: Response) => {
  try {
    const deletedItem = await Feedback.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return sendResponse(res, 404, false, null, 'Feedback item not found to delete', 'Not Found');
    }

    return sendResponse(res, 200, true, null, 'Feedback item deleted successfully');
  } catch (error: any) {
    return sendResponse(res, 500, false, null, 'Error deleting feedback item', error.message);
  }
};

// Generate AI theme summary from recent feedback (Admin)
export const getSummary = async (req: Request, res: Response) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentFeedback = await Feedback.find({
      ai_processed: true,
      createdAt: { $gte: sevenDaysAgo },
    }).select('ai_summary');

    if (recentFeedback.length === 0) {
      return sendResponse(res, 200, true, { themes: [] }, 'No AI-processed feedback found in the last 7 days');
    }

    const summaries = recentFeedback
      .map((f) => f.ai_summary)
      .filter((s): s is string => !!s);

    if (summaries.length === 0) {
      return sendResponse(res, 200, true, { themes: [] }, 'No AI summaries available');
    }

    const themeResult = await generateThemeSummary(summaries);

    if (!themeResult) {
      return sendResponse(res, 503, false, null, 'AI theme analysis is temporarily unavailable', 'Gemini service error');
    }

    return sendResponse(res, 200, true, themeResult, 'Theme summary generated successfully');
  } catch (error: any) {
    return sendResponse(res, 500, false, null, 'Error generating summary', error.message);
  }
};
