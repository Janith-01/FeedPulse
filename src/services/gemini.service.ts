import { GoogleGenAI } from '@google/genai';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface GeminiAnalysis {
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  priority_score: number;
  summary: string;
  tags: string[];
}

// ─── Gemini Client ───────────────────────────────────────────────────────────

const getClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }
  return new GoogleGenAI({ apiKey });
};

// ─── Analyse Feedback ────────────────────────────────────────────────────────

/**
 * Sends feedback title and description to Gemini for AI analysis.
 * Returns structured analysis or null on failure.
 */
export const analyseFeedback = async (
  title: string,
  description: string
): Promise<GeminiAnalysis | null> => {
  try {
    const client = getClient();

    const prompt = `Analyse this product feedback. Return ONLY valid JSON with these fields: category, sentiment (Positive/Neutral/Negative), priority_score (1-10), summary, tags.

Title: ${title}
Description: ${description}`;

    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    const text = response.text;

    if (!text) {
      console.error('⚠️  Gemini returned empty response');
      return null;
    }

    // Extract JSON from response (handles markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('⚠️  Could not extract JSON from Gemini response:', text);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeminiAnalysis;

    // Validate required fields
    if (
      !parsed.category ||
      !parsed.sentiment ||
      !parsed.priority_score ||
      !parsed.summary ||
      !parsed.tags
    ) {
      console.error('⚠️  Gemini response missing required fields:', parsed);
      return null;
    }

    // Validate sentiment value
    if (!['Positive', 'Neutral', 'Negative'].includes(parsed.sentiment)) {
      console.error('⚠️  Invalid sentiment value:', parsed.sentiment);
      return null;
    }

    // Clamp priority score to 1-10
    parsed.priority_score = Math.max(1, Math.min(10, Math.round(parsed.priority_score)));

    // Ensure tags is an array
    if (!Array.isArray(parsed.tags)) {
      parsed.tags = [String(parsed.tags)];
    }

    return parsed;
  } catch (error: any) {
    console.error('⚠️  Gemini analysis failed:', error.message);
    return null;
  }
};

// ─── Summarise Trends ────────────────────────────────────────────────────────

/**
 * Sends a batch of recent feedback to Gemini for trend summarisation.
 */
export const summariseTrends = async (
  feedbackList: Array<{ title: string; description: string; ai_category?: string; ai_sentiment?: string }>
): Promise<string | null> => {
  try {
    if (feedbackList.length === 0) {
      return 'No feedback received in the last 7 days.';
    }

    const client = getClient();

    const feedbackText = feedbackList
      .map(
        (f, i) =>
          `${i + 1}. Title: ${f.title} | Category: ${f.ai_category || 'N/A'} | Sentiment: ${f.ai_sentiment || 'N/A'}\n   ${f.description}`
      )
      .join('\n\n');

    const prompt = `You are an analytics assistant. Analyse these product feedback items from the last 7 days and provide a trend summary. Include: top recurring themes, overall sentiment distribution, urgent issues, and actionable recommendations. Keep it concise and structured.

Feedback Items:
${feedbackText}`;

    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    return response.text || 'Unable to generate summary.';
  } catch (error: any) {
    console.error('⚠️  Gemini trend summary failed:', error.message);
    return null;
  }
};
