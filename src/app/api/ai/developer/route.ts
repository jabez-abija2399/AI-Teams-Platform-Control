import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { implementArchitecture } from '@/packages/agents/roles/developer/developer.service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { productRequirementSchema } from '@/packages/agents/roles/ceo/ceo.types';
import type { ArchitectAnalysis } from '@/packages/agents/roles/architect/architect.types';
import type { ProductRequirement } from '@/packages/agents/roles/ceo/ceo.types';

const endpointSchema = z.object({
  path: z.string(),
  method: z.string().transform((v) => v.toUpperCase()),
  request: z.string().optional(),
  response: z.string(),
}).refine((ep) => ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(ep.method), {
  message: 'method must be GET, POST, PATCH, PUT, or DELETE',
});

const architectureSchema = z.object({
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
});

const requestSchema = z.object({
  projectId: z.string(),
  architecture: architectureSchema.optional(),
  requirements: productRequirementSchema.optional(),
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

async function fetchArchitectureFromDb(projectId: string): Promise<ArchitectAnalysis | null> {
  const docs = await prisma.document.findMany({
    where: { projectId, type: { in: ['SYSTEM_ARCHITECTURE', 'DATABASE_DESIGN', 'API_SPECIFICATION'] } },
  });
  if (docs.length < 3) return null;
  const archDoc = docs.find((d) => d.type === 'SYSTEM_ARCHITECTURE');
  const dbDoc = docs.find((d) => d.type === 'DATABASE_DESIGN');
  const apiDoc = docs.find((d) => d.type === 'API_SPECIFICATION');
  if (!archDoc || !dbDoc || !apiDoc) return null;
  try {
    return {
      architecture: JSON.parse(archDoc.content),
      database: JSON.parse(dbDoc.content),
      api: JSON.parse(apiDoc.content),
      decisions: [],
      fileStructure: [],
      implementationTodos: [],
      qaTodos: [],
    } as ArchitectAnalysis;
  } catch {
    return null;
  }
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

  let architecture = parsed.data.architecture;
  if (!architecture) {
    const dbArch = await fetchArchitectureFromDb(parsed.data.projectId);
    if (!dbArch) {
      return NextResponse.json(
        { success: false, error: { message: 'No architecture found. Run Architect AI first.', code: 'PREREQUISITE_MISSING' } },
        { status: 400 },
      );
    }
    architecture = dbArch;
  }

  let requirements = parsed.data.requirements;
  if (!requirements) {
    const reqDoc = await prisma.document.findFirst({
      where: { projectId: parsed.data.projectId, type: 'REQUIREMENTS' },
      orderBy: { createdAt: 'desc' },
    });
    if (reqDoc) {
      try {
        requirements = productRequirementSchema.parse(JSON.parse(reqDoc.content)) as unknown as ProductRequirement;
      } catch {
        // non-critical — developer can proceed without requirements context
      }
    }
  }

  const architectureWithDefaults: ArchitectAnalysis = {
    ...architecture,
    fileStructure: (architecture as any)?.fileStructure ?? [],
    implementationTodos: (architecture as any)?.implementationTodos ?? [],
    qaTodos: (architecture as any)?.qaTodos ?? [],
  };

  // Fire-and-forget: start build in background, return immediately
  implementArchitecture(parsed.data.projectId, architectureWithDefaults, requirements ?? undefined).catch((err) => {
    console.error('[Developer] Background build failed:', err);
  });

  return NextResponse.json({
    success: true,
    data: { status: 'started', projectId: parsed.data.projectId },
  });
}
