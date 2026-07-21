import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unauthorizedResponse, toResponse } from '@/lib/api-response';
import { generateComponent } from '@/features/design-system/generator/ui-generator.service';

const requestBodySchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await request.json();
  const parsed = requestBodySchema.safeParse(body);

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

  const { projectId, description, category } = parsed.data;

  let agent = await prisma.agent.findFirst({
    where: { role: 'UI_UX' },
  });

  if (!agent) {
    agent = await prisma.agent.create({
      data: {
        name: 'UI/UX Designer',
        role: 'UI_UX',
        status: 'IDLE',
        capabilities: ['component-generation', 'design-system', 'ui-review'],
        description: 'AI agent specialized in UI/UX design and component generation.',
      },
    });
  }

  const result = await generateComponent(projectId, agent.id, description, category);
  return toResponse(result, 201);
}
