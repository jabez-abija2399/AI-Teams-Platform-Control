import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { reviewImplementation } from '@/ai/agents/roles/qa/qa.service';
import { z } from 'zod';

const requestSchema = z.object({
  projectId: z.string(),
  implementation: z.object({
    plan: z.object({
      tasks: z.array(z.string()),
      files: z.array(z.string()),
      dependencies: z.array(z.string()),
      implementationOrder: z.array(z.string()),
    }),
    changes: z.array(
      z.object({
        file: z.string(),
        changeType: z.string().transform((v) => v.toUpperCase() as 'CREATE' | 'MODIFY' | 'DELETE'),
        description: z.string(),
        code: z.string(),
      }),
    ),
    report: z.object({
      completed: z.boolean(),
      changedFiles: z.array(z.string()),
      issues: z.array(z.string()),
      notes: z.string(),
    }),
  }),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return NextResponse.json(
      { success: false, error: { message: `Invalid request: ${details}`, code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const result = await reviewImplementation(parsed.data.projectId, parsed.data.implementation);
  return toResponse(result);
}
