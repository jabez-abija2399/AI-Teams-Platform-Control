import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generatePlainSummary } from '@/features/architect-ai/services/plain-summary.service';
import { unauthorizedResponse } from '@/lib/api-response';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await request.json();
  const { projectId, architecture } = body;

  if (!projectId || !architecture) {
    return NextResponse.json(
      { success: false, error: { message: 'projectId and architecture required', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const summary = await generatePlainSummary(projectId, architecture);
  return NextResponse.json({ success: true, data: { summary } });
}
