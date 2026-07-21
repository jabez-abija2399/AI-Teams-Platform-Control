import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { getAuditLog } from '@/features/enterprise/audit/audit-log.service';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  const limitParam = searchParams.get('limit');

  if (!organizationId) {
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Missing required query parameter: organizationId', code: 'VALIDATION_ERROR' },
      },
      { status: 400 },
    );
  }

  const limit = limitParam ? parseInt(limitParam, 10) : 100;
  if (isNaN(limit) || limit < 1 || limit > 500) {
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Limit must be between 1 and 500', code: 'VALIDATION_ERROR' },
      },
      { status: 400 },
    );
  }

  const result = await getAuditLog(organizationId, limit);

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
