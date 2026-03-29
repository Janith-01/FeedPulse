import Feedback, { IFeedback } from '../models/Feedback';
import { analyseFeedback, GeminiAnalysis } from './gemini.service';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface FeedbackInput {
  title: string;
  description: string;
  category: string;
  submitterName?: string;
  submitterEmail?: string;
}

export interface FeedbackQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  category?: string;
  status?: string;
  sentiment?: string;
}

export interface PaginatedResult {
  feedback: IFeedback[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ─── Create Feedback ─────────────────────────────────────────────────────────

/**
 * Creates a new feedback entry and triggers AI analysis.
 * If AI analysis fails, the feedback is still saved.
 */
export const createFeedback = async (input: FeedbackInput): Promise<IFeedback> => {
  // Save the base feedback first
  const feedback = await Feedback.create({
    title: input.title,
    description: input.description,
    category: input.category,
    submitterName: input.submitterName,
    submitterEmail: input.submitterEmail,
  });

  // Attempt AI analysis (non-blocking for the save)
  try {
    const analysis: GeminiAnalysis | null = await analyseFeedback(
      input.title,
      input.description
    );

    if (analysis) {
      feedback.ai_category = analysis.category;
      feedback.ai_sentiment = analysis.sentiment;
      feedback.ai_priority = analysis.priority_score;
      feedback.ai_summary = analysis.summary;
      feedback.ai_tags = analysis.tags;
      feedback.ai_processed = true;
      await feedback.save();
    }
  } catch (error: any) {
    console.error(`⚠️  AI analysis failed for feedback ${feedback._id}:`, error.message);
    // Feedback is already saved — AI failure is non-fatal
  }

  return feedback;
};

// ─── Get All Feedback (Paginated, Sorted, Filtered) ─────────────────────────

export const findAllFeedback = async (query: FeedbackQuery): Promise<PaginatedResult> => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.max(1, Math.min(100, query.limit || 10));
  const skip = (page - 1) * limit;

  // Build filter
  const filter: Record<string, any> = {};

  if (query.category) {
    filter.category = query.category;
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.sentiment) {
    filter.ai_sentiment = query.sentiment;
  }

  // Build sort
  const sortField = (() => {
    switch (query.sort) {
      case 'priority':
        return 'ai_priority';
      case 'sentiment':
        return 'ai_sentiment';
      case 'date':
      default:
        return 'createdAt';
    }
  })();

  const sortOrder = query.order === 'asc' ? 1 : -1;

  const [feedback, total] = await Promise.all([
    Feedback.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit),
    Feedback.countDocuments(filter),
  ]);

  return {
    feedback,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

// ─── Get Single Feedback ─────────────────────────────────────────────────────

export const findFeedbackById = async (id: string): Promise<IFeedback | null> => {
  return Feedback.findById(id);
};

// ─── Update Status ───────────────────────────────────────────────────────────

export const updateFeedbackStatus = async (
  id: string,
  status: string
): Promise<IFeedback | null> => {
  return Feedback.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
};

// ─── Delete Feedback ─────────────────────────────────────────────────────────

export const deleteFeedback = async (id: string): Promise<IFeedback | null> => {
  return Feedback.findByIdAndDelete(id);
};

// ─── Get Recent Feedback (Last 7 Days) ───────────────────────────────────────

export const findRecentFeedback = async (): Promise<IFeedback[]> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return Feedback.find({ createdAt: { $gte: sevenDaysAgo } })
    .sort({ createdAt: -1 })
    .select('title description ai_category ai_sentiment ai_priority');
};
