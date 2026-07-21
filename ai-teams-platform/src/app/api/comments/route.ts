import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createComment, getComments } from '@/features/collaboration/comments/comment.service';
import { unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get('targetType');
  const targetId = searchParams.get('targetId');
  if (!targetType || !targetId) {
    return NextResponse.json({ success: false, error: { message: 'targetType and targetId required', code: 'VALIDATION_ERROR' } }, { status: 400 });
  }
  const comments = await getComments(targetType, targetId);
  return NextResponse.json({ success: true, data: comments });
}

const schema = z.object({
  targetType: z.string(),
  targetId: z.string(),
  content: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }, { status: 400 });
  }
  const result = await createComment('HUMAN', session.user.id, parsed.data.targetType, parsed.data.targetId, parsed.data.content);
  return NextResponse.json({ success: true, data: result }, { status: 201 });
}
