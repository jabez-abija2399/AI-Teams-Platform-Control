import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { install } from '@/features/marketplace/core/marketplace.engine';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await request.json();
  const { itemId, organizationId } = body;

  if (!itemId || !organizationId) {
    return NextResponse.json(
      {
        success: false,
        error: { message: 'itemId and organizationId are required', code: 'VALIDATION_ERROR' },
      },
      { status: 400 },
    );
  }

  const result = await install(itemId, organizationId);

  if (!result.success) {
    const status = result.error.code === 'NOT_FOUND' ? 404 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
