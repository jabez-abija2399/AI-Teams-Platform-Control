import { generateStructured } from '@/ai/services/ai.service';
import type { ApiResult } from '@/types/common.types';

export interface SentimentAnalysis {
  score: number;
  emotion: string;
  priority: string;
}

export async function analyzeSentiment(
  feedbackId: string,
  content: string,
): Promise<ApiResult<SentimentAnalysis>> {
  const result = await generateStructured<SentimentAnalysis>(
    {
      messages: [
        {
          role: 'user',
          content: `Analyze the sentiment of the following customer feedback. Provide:\n- score: a number from -1 (very negative) to 1 (very positive), where 0 is neutral\n- emotion: the primary emotion (e.g., "frustrated", "happy", "confused", "angry", "satisfied", "urgent")\n- priority: "HIGH", "MEDIUM", or "LOW" based on urgency and impact\n\nFeedback:\n"${content}"`,
        },
      ],
      systemPrompt:
        'You are a sentiment analysis expert. Analyze customer feedback and provide a sentiment score, dominant emotion, and priority assessment. Respond with a JSON object containing "score", "emotion", and "priority".',
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

  const { prisma } = await import('@/lib/prisma');

  const clampedScore = Math.max(-1, Math.min(1, result.data.score));

  await prisma.sentimentResult.create({
    data: {
      feedbackId,
      score: clampedScore,
      emotion: result.data.emotion,
      priority: result.data.priority,
    },
  });

  return {
    success: true,
    data: {
      score: clampedScore,
      emotion: result.data.emotion,
      priority: result.data.priority,
    },
  };
}
