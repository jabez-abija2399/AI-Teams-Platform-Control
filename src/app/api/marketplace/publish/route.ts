import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { publish } from '@/features/marketplace/core/marketplace.engine';

const schema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.string().min(1),
  author: z.string().min(1),
  version: z.string().min(1),
  payload: z.unknown(),
  category: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const { name, description, type, author, version, payload, category } = parsed.data;
  const result = await publish(name, description, type, author, version, payload, category);
  return NextResponse.json(result, { status: result.success ? 201 : 400 });
}
