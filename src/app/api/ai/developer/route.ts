import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { implementArchitecture } from '@/ai/agents/roles/developer/developer.service';
import { z } from 'zod';

const endpointSchema = z.object({
  path: z.string(),
  method: z.string().transform((v) => v.toUpperCase()),
  request: z.string().optional(),
  response: z.string(),
}).refine((ep) => ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(ep.method), {
  message: 'method must be GET, POST, PATCH, PUT, or DELETE',
});

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
      endpoints: z.array(endpointSchema),
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

function normalizeArchitectureMethods(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const b = body as Record<string, unknown>;
  if (b.architecture && typeof b.architecture === 'object') {
    const a = b.architecture as Record<string, unknown>;
    if (a.api && typeof a.api === 'object') {
      const api = a.api as Record<string, unknown>;
      if (Array.isArray(api.endpoints)) {
        api.endpoints = api.endpoints.map((ep: unknown) => {
          if (ep && typeof ep === 'object') {
            const e = ep as Record<string, unknown>;
            if (typeof e.method === 'string') {
              e.method = e.method.toUpperCase();
            }
          }
          return ep;
        });
      }
    }
  }
  return b;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const rawBody = await request.json();
  const body = normalizeArchitectureMethods(rawBody);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return NextResponse.json(
      { success: false, error: { message: `Invalid request: ${details}`, code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  // Fire-and-forget: start build in background, return immediately
  implementArchitecture(parsed.data.projectId, parsed.data.architecture).catch((err) => {
    console.error('[Developer] Background build failed:', err);
  });

  return NextResponse.json({
    success: true,
    data: { status: 'started', projectId: parsed.data.projectId },
  });
}
