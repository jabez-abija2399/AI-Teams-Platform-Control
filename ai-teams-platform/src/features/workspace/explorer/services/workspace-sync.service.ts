import { prisma } from '@/lib/prisma';

interface SyncFile {
  path: string;
  content: string;
  language?: string | null;
}

async function ensureFolder(
  projectId: string,
  parentId: string | null,
  name: string,
  path: string,
): Promise<string> {
  const existing = await prisma.folder.findFirst({ where: { projectId, parentId, name } });
  if (existing) return existing.id;
  const created = await prisma.folder.create({ data: { projectId, parentId, name, path } });
  return created.id;
}

export async function syncFilesToWorkspace(
  projectId: string,
  files: SyncFile[],
): Promise<void> {
  if (files.length === 0) return;

  let repo = await prisma.repository.findUnique({ where: { projectId } });
  if (!repo) {
    repo = await prisma.repository.create({ data: { projectId, path: `/workspace/${projectId}` } });
  }

  const allDirs = new Set<string>();
  for (const file of files) {
    const parts = file.path.split('/');
    parts.pop();
    let acc = '';
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part;
      allDirs.add(acc);
    }
  }

  const dirToId = new Map<string, string>();
  for (const dirPath of allDirs) {
    const parts = dirPath.split('/');
    const name = parts[parts.length - 1] ?? dirPath;
    const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
    const parentId: string | null = parentPath !== null ? (dirToId.get(parentPath) ?? null) : null;
    const id = await ensureFolder(projectId, parentId, name, dirPath);
    dirToId.set(dirPath, id);
  }

  const existingFiles = await prisma.file.findMany({
    where: { repositoryId: repo.id, path: { in: files.map((f) => f.path) } },
    select: { id: true, path: true },
  });
  const existingMap = new Map(existingFiles.map((f) => [f.path, f.id]));

  await Promise.all(
    files.map((file) => {
      const parts = file.path.split('/');
      parts.pop();
      const dirPath = parts.join('/') || null;
      const folderId = dirPath && dirToId.has(dirPath) ? dirToId.get(dirPath)! : null;
      const existingId = existingMap.get(file.path);

      if (existingId) {
        return prisma.file.update({
          where: { id: existingId },
          data: { content: file.content, folderId, language: file.language ?? null },
        });
      }
      return prisma.file.create({
        data: {
          repositoryId: repo!.id,
          folderId,
          path: file.path,
          content: file.content,
          language: file.language ?? null,
        },
      });
    }),
  );
}

export async function syncFileToWorkspace(
  projectId: string,
  filePath: string,
  content: string,
  language: string | null = null,
): Promise<void> {
  await syncFilesToWorkspace(projectId, [{ path: filePath, content, language }]);
}
