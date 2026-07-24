import { NextResponse } from 'next/server';
import { buildPreview } from '@/features/workspace/preview/services/preview-builder.service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const preview = await buildPreview(projectId);
  return NextResponse.json({ success: true, data: preview });
}
