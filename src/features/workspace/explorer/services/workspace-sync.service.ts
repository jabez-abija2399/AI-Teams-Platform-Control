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

function isMissingColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /reviewStatus|previousContent|column .* does not exist|P2022/i.test(msg) ||
    (typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: string }).code === 'P2022')
  );
}

/**
 * Sync agent-generated files into Explorer.
 * Overwrites mark reviewStatus=pending when those columns exist.
 * Falls back without review columns if DB was not migrated yet.
 */
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
    select: { id: true, path: true, content: true },
  });
  const existingMap = new Map(existingFiles.map((f) => [f.path, f]));

  let useReviewColumns = true;

  for (const file of files) {
    const parts = file.path.split('/');
    parts.pop();
    const dirPath = parts.join('/') || null;
    const folderId = dirPath && dirToId.has(dirPath) ? dirToId.get(dirPath)! : null;
    const existing = existingMap.get(file.path);

    try {
      if (existing) {
        const contentChanged = existing.content !== file.content;
        if (useReviewColumns) {
          await prisma.file.update({
            where: { id: existing.id },
            data: {
              content: file.content,
              folderId,
              language: file.language ?? null,
              ...(contentChanged
                ? {
                    reviewStatus: 'pending',
                    previousContent: existing.content,
                  }
                : {}),
            },
          });
        } else {
          await prisma.file.update({
            where: { id: existing.id },
            data: {
              content: file.content,
              folderId,
              language: file.language ?? null,
            },
          });
        }
      } else if (useReviewColumns) {
        await prisma.file.create({
          data: {
            repositoryId: repo.id,
            folderId,
            path: file.path,
            content: file.content,
            language: file.language ?? null,
            reviewStatus: 'pending',
            previousContent: null,
          },
        });
      } else {
        await prisma.file.create({
          data: {
            repositoryId: repo.id,
            folderId,
            path: file.path,
            content: file.content,
            language: file.language ?? null,
          },
        });
      }
    } catch (err) {
      if (useReviewColumns && isMissingColumnError(err)) {
        useReviewColumns = false;
        // Retry this file without review columns
        if (existing) {
          await prisma.file.update({
            where: { id: existing.id },
            data: {
              content: file.content,
              folderId,
              language: file.language ?? null,
            },
          });
        } else {
          await prisma.file.create({
            data: {
              repositoryId: repo.id,
              folderId,
              path: file.path,
              content: file.content,
              language: file.language ?? null,
            },
          });
        }
        continue;
      }
      throw err;
    }
  }
}

export async function syncFileToWorkspace(
  projectId: string,
  filePath: string,
  content: string,
  language: string | null = null,
): Promise<void> {
  await syncFilesToWorkspace(projectId, [{ path: filePath, content, language }]);
}

export async function reviewWorkspaceFile(
  projectId: string,
  path: string,
  action: 'accept' | 'reject',
): Promise<{ ok: boolean; message: string }> {
  const repo = await prisma.repository.findUnique({ where: { projectId } });
  if (!repo) return { ok: false, message: 'No repository' };

  const file = await prisma.file.findFirst({ where: { repositoryId: repo.id, path } });
  if (!file) return { ok: false, message: 'File not found' };

  try {
    if (action === 'accept') {
      await prisma.file.update({
        where: { id: file.id },
        data: { reviewStatus: 'accepted', previousContent: null },
      });
      return { ok: true, message: 'Accepted' };
    }

    if (file.previousContent == null) {
      await prisma.file.delete({ where: { id: file.id } });
      return { ok: true, message: 'Rejected — new file removed' };
    }

    await prisma.file.update({
      where: { id: file.id },
      data: {
        content: file.previousContent,
        reviewStatus: 'rejected',
        previousContent: null,
      },
    });
    return { ok: true, message: 'Rejected — restored previous content' };
  } catch (err) {
    if (isMissingColumnError(err)) {
      return {
        ok: false,
        message: 'File review columns missing — run prisma/manual/add_file_review_columns.sql',
      };
    }
    throw err;
  }
}

export async function acceptAllPendingFiles(
  projectId: string,
): Promise<{ count: number }> {
  const repo = await prisma.repository.findUnique({ where: { projectId } });
  if (!repo) return { count: 0 };

  try {
    const result = await prisma.file.updateMany({
      where: { repositoryId: repo.id, reviewStatus: 'pending' },
      data: { reviewStatus: 'accepted', previousContent: null },
    });
    return { count: result.count };
  } catch (err) {
    if (isMissingColumnError(err)) return { count: 0 };
    throw err;
  }
}
