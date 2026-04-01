import { IGeminiFeedbackAnalysis } from './gemini.service';

// ==========================================
// Keyword lists
// ==========================================

const NEGATIVE_KEYWORDS = [
  "broken", "crash", "error", "bug", "fail", "terrible",
  "awful", "useless", "hate", "can't", "doesn't work", "slow", "frustrating",
];

const POSITIVE_KEYWORDS = [
  "great", "love", "awesome", "helpful", "fast", "easy",
  "excellent", "perfect", "amazing", "thank",
];

// ==========================================
// Helpers
// ==========================================

function detectSentiment(text: string): 'Positive' | 'Neutral' | 'Negative' {
  const lower = text.toLowerCase();

  for (const kw of NEGATIVE_KEYWORDS) {
    if (lower.includes(kw)) return 'Negative';
  }
  for (const kw of POSITIVE_KEYWORDS) {
    if (lower.includes(kw)) return 'Positive';
  }
  return 'Neutral';
}

function scorePriority(
  sentiment: 'Positive' | 'Neutral' | 'Negative',
  title: string,
  description: string,
): number {
  let score = 5;

  if (sentiment === 'Negative') score += 2;
  if (description.length > 200) score += 1;

  const titleLower = title.toLowerCase();
  if (titleLower.includes('urgent') || titleLower.includes('critical')) score += 2;

  return Math.min(score, 10);
}

/**
 * Takes the first 100 characters of description, trims at the last complete
 * word boundary, and appends "...".
 * e.g. "User reports the login button does not respond on mobile devices..."
 */
function buildSummary(description: string): string {
  if (description.length <= 100) return description;

  const slice = description.slice(0, 100);
  const lastSpace = slice.lastIndexOf(' ');
  const trimmed = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${trimmed}...`;
}

/**
 * Extracts capitalized words (4+ chars) from the combined title + description,
 * deduplicates, and returns the first 5.
 * e.g. ["Dashboard", "Login", "Mobile"]
 */
function extractTags(title: string, description: string): string[] {
  const combined = `${title} ${description}`;
  // Match sequences of alphabetic characters starting with a capital letter
  const matches = combined.match(/\b[A-Z][a-z]{3,}\b/g) ?? [];
  const unique = [...new Set(matches)];
  return unique.slice(0, 5);
}

// ==========================================
// Public API
// ==========================================

/**
 * Rule-based fallback analyzer. Returns the same shape as IGeminiFeedbackAnalysis
 * so it can be used as a drop-in replacement when Gemini is unavailable.
 *
 * NOTE: `category` is intentionally omitted here — callers should supply it
 * directly from the user-submitted Feedback document (no inference needed).
 */
export function fallbackAnalyze(
  title: string,
  description: string,
): IGeminiFeedbackAnalysis {
  const sentiment = detectSentiment(description);
  const priority_score = scorePriority(sentiment, title, description);
  const summary = buildSummary(description);
  const tags = extractTags(title, description);

  return {
    // Category is passed through from the user submission by the caller.
    // We default to 'Other' here so the return type is satisfied; the caller
    // overwrites it with the actual stored category before saving.
    category: 'Other',
    sentiment,
    priority_score,
    summary,
    tags,
  };
}
