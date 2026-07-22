import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { reviewCode } from '@/features/code-review/services/review.service';
import { reviewRequestSchema } from '@/features/code-review/schemas/review.schema';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const parsed = reviewRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Invalid input',
          code: 'VALIDATION_ERROR',
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await reviewCode(parsed.data.files);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[Code Review] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Review failed',
          code: 'AI_ERROR',
        },
      },
      { status: 500 },
    );
  }
}
