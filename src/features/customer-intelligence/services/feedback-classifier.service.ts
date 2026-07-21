import { generateStructured } from '@/ai/services/ai.service';
import type { ApiResult } from '@/types/common.types';

export type FeedbackType =
  | 'BUG'
  | 'FEATURE_REQUEST'
  | 'QUESTION'
  | 'COMPLAINT'
  | 'PRAISE'
  | 'IMPROVEMENT';

export interface FeedbackClassification {
  type: FeedbackType;
  confidence: number;
  summary: string;
}

export async function classifyFeedback(
  content: string,
): Promise<ApiResult<FeedbackClassification>> {
  const result = await generateStructured<FeedbackClassification>(
    {
      messages: [
        {
          role: 'user',
          content: `Classify the following customer feedback into exactly one category. Provide a confidence score between 0 and 1, and a brief summary.\n\nFeedback:\n"${content}"`,
        },
      ],
      systemPrompt: `You are a feedback classifier. Given customer feedback text, determine its type.
Categories:
- BUG: The user reports a defect, error, or malfunction.
- FEATURE_REQUEST: The user asks for new functionality.
- QUESTION: The user asks a question about how to use something.
- COMPLAINT: The user expresses dissatisfaction or frustration.
- PRAISE: The user expresses satisfaction or compliments.
- IMPROVEMENT: The user suggests an enhancement to existing functionality.

Respond with a JSON object containing "type", "confidence", and "summary".`,
      provider: 'gemini',
    },
    { provider: 'gemini' },
  );

  if (!result.success) {
    return {
      success: false,
      error: { message: result.error.message, code: result.error.code },
    };
  }

  return { success: true, data: result.data };
}
