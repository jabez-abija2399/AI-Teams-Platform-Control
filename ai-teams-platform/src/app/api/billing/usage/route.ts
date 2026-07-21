import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { getOrganizationCost } from '@/features/billing/cost/cost-calculator.service';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: { message: 'organizationId is required', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const costThisMonth = await getOrganizationCost(organizationId, startOfMonth);

  return NextResponse.json({ success: true, data: { costThisMonth } });
}
