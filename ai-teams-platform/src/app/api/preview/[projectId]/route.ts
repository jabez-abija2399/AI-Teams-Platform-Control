import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { buildPreview } from '@/features/workspace/preview/services/preview-builder.service';
import { unauthorizedResponse } from '@/lib/api-response';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const { projectId } = await params;
  const preview = await buildPreview(projectId);
  return NextResponse.json({ success: true, data: preview });
}
