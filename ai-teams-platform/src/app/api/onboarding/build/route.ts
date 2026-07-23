import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { runFullCompanyWorkflow } from '@/core/master-orchestrator/master-orchestrator';
import { unauthorizedResponse } from '@/lib/api-response';

const schema = z.object({ projectId: z.string(), idea: z.string() });

export async function POST(request: Request) {
  // const session = await auth();
  // if (!session?.user?.id) return unauthorizedResponse();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Build endpoint timed out after 180s')), 180_000)
  );
  const workflowPromise = runFullCompanyWorkflow(parsed.data.projectId, parsed.data.idea);
  const result = await Promise.race([workflowPromise, timeoutPromise]);

  if (!result.success) {
    console.error('[Build API] Full company workflow failed:', result.error);
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 200 });
}
