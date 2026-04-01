import { type Request, type Response } from 'express';
import Feedback from '../models/Feedback';
import { sendResponse } from '../utils/responseHelper';
import { analyzeFeedback } from '../services/gemini.service';

const DEAD_LETTER_THRESHOLD = 3;

// Helper — 'sleep' utility for sequential retry pacing
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// GET /api/admin/dead-queue
// ==========================================
export const getDeadQueue = async (req: Request, res: Response) => {
  try {
    const deadItems = await Feedback.find({
      ai_processed: false,
      ai_retry_count: { $gte: DEAD_LETTER_THRESHOLD },
    })
      .select('title createdAt ai_retry_count ai_last_error')
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, true, {
      items: deadItems,
      count: deadItems.length,
    }, `${deadItems.length} dead-letter item(s) found`);
  } catch (error: any) {
    return sendResponse(res, 500, false, null, 'Error fetching dead queue', error.message);
  }
};

// ==========================================
// POST /api/admin/dead-queue/retry-all
// ==========================================
export const retryDeadQueue = async (req: Request, res: Response) => {
  try {
    const deadItems = await Feedback.find({
      ai_processed: false,
      ai_retry_count: { $gte: DEAD_LETTER_THRESHOLD },
    });

    if (deadItems.length === 0) {
      return sendResponse(res, 200, true, {
        attempted: 0,
        succeeded: 0,
        failed: 0,
      }, 'No dead-letter items to retry');
    }

    let succeeded = 0;
    let failed = 0;

    for (const item of deadItems) {
      // Reset retry state before attempting
      await Feedback.findByIdAndUpdate(item._id, {
        ai_retry_count: 0,
        ai_last_error: null,
      });

      try {
        const aiData = await analyzeFeedback(item.title, item.description);

        if (aiData) {
          await Feedback.findByIdAndUpdate(item._id, {
            ai_category: aiData.category,
            ai_sentiment: aiData.sentiment,
            ai_priority: aiData.priority_score,
            ai_summary: aiData.summary,
            ai_tags: aiData.tags,
            ai_processed: true,
            ai_last_error: null,
          });
          succeeded++;
        } else {
          // Gemini returned null (circuit breaker or parse failure)
          await Feedback.findByIdAndUpdate(item._id, {
            ai_retry_count: 1,
            ai_last_error: 'AI service returned no result during retry',
          });
          failed++;
        }
      } catch (err: any) {
        await Feedback.findByIdAndUpdate(item._id, {
          ai_retry_count: 1,
          ai_last_error: err.message || 'Retry failed with unknown error',
        });
        failed++;
      }

      // 500ms delay between each to avoid rate limiting
      await sleep(500);
    }

    return sendResponse(res, 200, true, {
      attempted: deadItems.length,
      succeeded,
      failed,
    }, `Retry complete: ${succeeded} succeeded, ${failed} failed`);
  } catch (error: any) {
    return sendResponse(res, 500, false, null, 'Error retrying dead queue', error.message);
  }
};
