import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUsagePercent } from '@/features/billing/limits/limit-checker.service';
import { unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const organizationId = new URL(request.url).searchParams.get('organizationId');
  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: { message: 'organizationId required', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }
  const status = await getUsagePercent(organizationId);
  return NextResponse.json({ success: true, data: status });
}
