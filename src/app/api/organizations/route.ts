import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createOrganization, listUserOrganizations } from '@/features/collaboration/organizations/organization.service';
import { unauthorizedResponse } from '@/lib/api-response';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const orgs = await listUserOrganizations(session.user.id);
  return NextResponse.json({ success: true, data: orgs });
}

const schema = z.object({ name: z.string().min(2) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }, { status: 400 });
  }
  const result = await createOrganization(session.user.id, parsed.data.name);
  return NextResponse.json(result, { status: 201 });
}
