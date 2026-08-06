import { NextResponse } from 'next/server';
import { buildPreview } from '@/features/workspace/preview/services/preview-builder.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const url = new URL(request.url);
  const entry = url.searchParams.get('entry') || url.searchParams.get('path');
  const smoke = url.searchParams.get('smoke') !== '0';
  const speed = url.searchParams.get('speed'); // fast | full
  const preferFast = speed !== 'full';

  const preview = await buildPreview(projectId, {
    entryPath: entry,
    smoke,
    preferFast,
    skipConfirmation: true,
  });

  return NextResponse.json({ success: true, data: preview });
}
