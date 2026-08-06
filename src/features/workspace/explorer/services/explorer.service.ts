import { prisma } from '@/lib/prisma';
import type { ExplorerNode, ExplorerFolderNode } from '../types/explorer.types';

export async function getFolderContents(
  projectId: string,
  folderId: string | null,
): Promise<ExplorerNode[]> {
  try {
    const [folders, files] = await Promise.all([
      prisma.folder.findMany({
        where: { projectId, parentId: folderId },
        orderBy: { name: 'asc' },
      }),
      prisma.file.findMany({
        where: folderId
          ? { folderId }
          : { repository: { projectId }, folderId: null },
        orderBy: { path: 'asc' },
        include: { metadata: true },
      }),
    ]);

    const folderNodes: ExplorerFolderNode[] = folders.map((f) => ({
      id: f.id,
      type: 'folder',
      name: f.name,
      path: f.path,
      children: [],
    }));

    const fileNodes: ExplorerNode[] = files
      .filter((f) => !f.metadata?.isHidden)
      .map((f) => ({
        id: f.id,
        type: 'file' as const,
        name: f.path.split('/').pop() ?? f.path,
        path: f.path,
        language: f.language,
        reviewStatus: (f.reviewStatus as 'accepted' | 'pending' | 'rejected') || 'accepted',
      }));

    const result = [...folderNodes, ...fileNodes];
    return result;
  } catch (err) {
    console.error(`[ExplorerService] Error fetching contents for project ${projectId}:`, err);
    return [];
  }
}

export async function createFolder(
  projectId: string,
  parentId: string | null,
  name: string,
) {
  const parent = parentId
    ? await prisma.folder.findUnique({ where: { id: parentId } })
    : null;
  const path = parent ? `${parent.path}/${name}` : name;
  return prisma.folder.create({
    data: { projectId, parentId, name, path },
  });
}
