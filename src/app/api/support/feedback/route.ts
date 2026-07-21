import { NextResponse } from 'next/server';
import { classifyFeedback } from '@/features/customer-intelligence/services/feedback-classifier.service';
import { analyzeSentiment } from '@/features/customer-intelligence/sentiment/sentiment-analyzer.service';

export async function POST(request: Request) {
  let body: { projectId?: string; customerId?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      },
      { status: 400 },
    );
  }

  const { projectId, customerId, content } = body;

  if (!projectId || !customerId || !content) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Missing required fields: projectId, customerId, content',
          code: 'VALIDATION_ERROR',
        },
      },
      { status: 400 },
    );
  }

  if (typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Content must be a non-empty string', code: 'VALIDATION_ERROR' },
      },
      { status: 400 },
    );
  }

  const classification = await classifyFeedback(content);
  if (!classification.success) {
    return NextResponse.json(
      {
        success: false,
        error: { message: classification.error.message, code: classification.error.code },
      },
      { status: 500 },
    );
  }

  const { prisma } = await import('@/lib/prisma');

  const feedback = await prisma.feedback.create({
    data: {
      projectId,
      customerId,
      type: classification.data.type,
      content: content.trim(),
      priority: classification.data.type === 'BUG' || classification.data.type === 'COMPLAINT'
        ? 'HIGH'
        : 'MEDIUM',
      status: 'NEW',
    },
  });

  const sentiment = await analyzeSentiment(feedback.id, content);

  return NextResponse.json(
    {
      success: true,
      data: {
        feedback: {
          id: feedback.id,
          projectId: feedback.projectId,
          customerId: feedback.customerId,
          type: feedback.type,
          content: feedback.content,
          priority: feedback.priority,
          status: feedback.status,
          createdAt: feedback.createdAt,
        },
        classification: classification.data,
        sentiment: sentiment.success ? sentiment.data : null,
      },
    },
    { status: 201 },
  );
}
