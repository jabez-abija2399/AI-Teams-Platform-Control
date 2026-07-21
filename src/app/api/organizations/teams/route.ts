import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createTeam } from '@/features/collaboration/teams/team.service';
import { unauthorizedResponse } from '@/lib/api-response';

const schema = z.object({
  organizationId: z.string(),
  name: z.string().min(2),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }, { status: 400 });
  }
  const result = await createTeam(parsed.data.organizationId, parsed.data.name, parsed.data.description);
  return NextResponse.json(result, { status: 201 });
}
