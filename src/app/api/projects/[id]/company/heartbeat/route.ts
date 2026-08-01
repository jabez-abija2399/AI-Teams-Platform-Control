import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { NextResponse } from 'next/server';
import { ContinuousCompanyOrchestrator } from '@/core/company';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const heartbeat = ContinuousCompanyOrchestrator.getHeartbeat(id);

  return NextResponse.json({
    success: true,
    data: heartbeat,
  });
}
