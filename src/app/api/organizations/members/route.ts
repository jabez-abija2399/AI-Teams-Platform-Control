import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrganizationMembers } from '@/features/collaboration/organizations/organization.service';
import { unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  if (!organizationId) {
    return NextResponse.json({ success: false, error: { message: 'organizationId required', code: 'VALIDATION_ERROR' } }, { status: 400 });
  }
  const members = await getOrganizationMembers(organizationId);
  return NextResponse.json({ success: true, data: members });
}
