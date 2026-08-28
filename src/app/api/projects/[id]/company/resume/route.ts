import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { NextResponse } from 'next/server';
import { PipelineManager } from '@/core/integration/pipeline-manager';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const status = await PipelineManager.resumeProject(id);

  return NextResponse.json({
    success: true,
    data: status,
  });
}
