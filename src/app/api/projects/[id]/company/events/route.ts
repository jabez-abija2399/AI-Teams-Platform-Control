import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { NextResponse } from 'next/server';
import { PipelineManager } from '@/core/integration/pipeline-manager';
import { checkProjectAccess } from '@/lib/project-access';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const access = await checkProjectAccess(id, session.user.id);
  if (!access.hasAccess) {
    return NextResponse.json(
      { success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 100;

  const events = import('@/core/company/company-event-bus').then(m => m.companyEventBus.getHistory(id).slice(-limit));

  return NextResponse.json({
    success: true,
    data: events,
  });
}
