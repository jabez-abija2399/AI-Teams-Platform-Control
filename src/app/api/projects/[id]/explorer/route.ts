import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFolderContents } from '@/features/workspace/explorer/services/explorer.service';

/**
 * Explorer listing — only real files/folders for this projectId.
 * Never invents phantom virt_ nodes from the platform source tree.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  if (!projectId || projectId === 'undefined' || projectId === 'null') {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid project id', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const folderId = url.searchParams.get('folderId') || null;
  const path = url.searchParams.get('path');

  if (path) {
    try {
      const repo = await prisma.repository.findUnique({ where: { projectId } });
      if (!repo) {
        return NextResponse.json({ success: true, data: [] });
      }
      const file = await prisma.file.findFirst({
        where: { repositoryId: repo.id, path },
      });
      if (!file) {
        return NextResponse.json({ success: true, data: [] });
      }
      return NextResponse.json({
        success: true,
        data: [
          {
            id: file.id,
            type: 'file' as const,
            name: file.path.split('/').pop() ?? file.path,
            path: file.path,
            language: file.language,
            reviewStatus: file.reviewStatus ?? 'accepted',
          },
        ],
      });
    } catch (err) {
      console.error('[Explorer] Error fetching file:', err);
      return NextResponse.json({ success: true, data: [] });
    }
  }

  const nodes = await getFolderContents(projectId, folderId);
  return NextResponse.json({ success: true, data: nodes });
}
