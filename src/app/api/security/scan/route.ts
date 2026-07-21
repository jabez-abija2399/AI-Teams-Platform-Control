import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { scanProject } from '@/features/security-engine/core/security.engine';

const bodySchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Invalid request body',
          code: 'VALIDATION_ERROR',
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await scanProject(parsed.data.projectId);
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Security scan failed',
          code: 'SCAN_ERROR',
        },
      },
      { status: 500 },
    );
  }
}
