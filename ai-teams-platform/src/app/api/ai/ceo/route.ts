import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { analyzeUserIdea } from '@/ai/agents/roles/ceo/ceo.service';
import { z } from 'zod';

const requestSchema = z.object({
  projectId: z.string(),
  userIdea: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const result = await analyzeUserIdea(parsed.data.projectId, parsed.data.userIdea);
  return toResponse(result);
}
