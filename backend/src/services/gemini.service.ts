import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export interface IGeminiFeedbackAnalysis {
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  priority_score: number;
  summary: string;
  tags: string[];
}

export const analyzeFeedback = async (
  title: string,
  description: string
): Promise<IGeminiFeedbackAnalysis | null> => {
  try {
    const prompt = `
      Analyze this product feedback. 
      Return ONLY a valid JSON object with these EXACT fields: 
      category, sentiment (must be 'Positive', 'Neutral', or 'Negative'), 
      priority_score (Number: 1-10), summary, tags (Array of strings).
      
      Feedback Title: ${title}
      Feedback Description: ${description}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the AI result to extract JSON if it includes markdown code blocks
    const cleanedText = text.replace(/```json|```/gi, '').trim();
    
    try {
      const parsedData = JSON.parse(cleanedText);
      return parsedData as IGeminiFeedbackAnalysis;
    } catch (parseError) {
      console.error('Error parsing Gemini JSON response:', cleanedText);
      return null;
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    return null;
  }
};

// ==========================================
// Theme Summary Generation
// ==========================================

export interface ITheme {
  title: string;
  description: string;
}

export interface IThemeSummaryResult {
  themes: ITheme[];
}

export const generateThemeSummary = async (
  summaries: string[]
): Promise<IThemeSummaryResult | null> => {
  try {
    const joined = summaries.join('\n- ');
    const prompt = `
      Here are summaries of recent product feedback:
      - ${joined}

      Return ONLY valid JSON with this shape:
      { "themes": [ { "title": "string", "description": "string" } ] }
      List the top 3 most common themes.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json|```/gi, '').trim();

    try {
      const parsedData = JSON.parse(cleanedText);
      return parsedData as IThemeSummaryResult;
    } catch (parseError) {
      console.error('Error parsing Gemini theme summary JSON:', cleanedText);
      return null;
    }
  } catch (error) {
    console.error('Gemini Theme Summary Error:', error);
    return null;
  }
};
