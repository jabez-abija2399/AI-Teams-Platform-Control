import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { NextResponse } from 'next/server';
import { ContinuousCompanyOrchestrator } from '@/core/company';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 100;

  const events = ContinuousCompanyOrchestrator.getEvents(id, limit);

  return NextResponse.json({
    success: true,
    data: events,
  });
}
