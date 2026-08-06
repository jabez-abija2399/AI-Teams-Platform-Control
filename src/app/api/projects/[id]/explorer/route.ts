import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFolderContents } from '@/features/workspace/explorer/services/explorer.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const url = new URL(request.url);
  const folderId = url.searchParams.get('folderId') || null;
  const path = url.searchParams.get('path');

  if (path) {
    let file = null;
    try {
      const repo = await prisma.repository.findUnique({ where: { projectId } });
      if (repo) {
        file = await prisma.file.findFirst({
          where: { repositoryId: repo.id, path },
        });
      }
    } catch (err) {
      console.error('[Explorer] Error fetching file:', err);
    }

    const fileName = path.split('/').pop() ?? path;

    return NextResponse.json({
      success: true,
      data: [{
        id: file?.id || `virt_${Buffer.from(path).toString('hex')}`,
        type: 'file' as const,
        name: fileName,
        path,
        language: path.endsWith('.json') ? 'json' : 'typescript',
      }],
    });
  }

  const nodes = await getFolderContents(projectId, folderId);
  return NextResponse.json({ success: true, data: nodes });
}
