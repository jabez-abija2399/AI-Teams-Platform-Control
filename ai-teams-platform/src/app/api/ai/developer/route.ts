import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { implementArchitecture } from '@/ai/agents/roles/developer/developer.service';
import { z } from 'zod';

const requestSchema = z.object({
  projectId: z.string(),
  architecture: z.object({
    architecture: z.object({
      frontend: z.string(),
      backend: z.string(),
      database: z.string(),
      infrastructure: z.string(),
      security: z.string(),
    }),
    database: z.object({
      entities: z.array(
        z.object({
          name: z.string(),
          fields: z.array(z.object({ name: z.string(), type: z.string() })),
        }),
      ),
      relationships: z.array(z.string()),
      indexes: z.array(z.string()),
      constraints: z.array(z.string()),
    }),
    api: z.object({
      endpoints: z.array(
        z.object({
          path: z.string(),
          method: z.enum(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']),
          request: z.string().optional(),
          response: z.string(),
        }),
      ),
    }),
    decisions: z.array(
      z.object({
        technology: z.string(),
        reason: z.string(),
        alternative: z.string(),
        tradeoff: z.string(),
      }),
    ),
  }),
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

  const result = await implementArchitecture(parsed.data.projectId, parsed.data.architecture);
  return toResponse(result);
}
