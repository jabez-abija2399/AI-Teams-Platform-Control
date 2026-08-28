/**
 * @file file-operations.tool.ts
 * @package @ai-teams/agents/tools
 * @description Sandboxed file read/write operations for Developer and QA agents.
 */

import { prisma } from '@/lib/prisma';

export class FileOperationsTool {
  /**
   * Reads a virtual file from the project repository.
   */
  public static async readFile(projectId: string, filePath: string): Promise<string | null> {
    const repo = await prisma.repository.findUnique({
      where: { projectId },
      include: { files: true },
    });
    const file = repo?.files.find((f) => f.path === filePath);
    return file ? file.content : null;
  }

  /**
   * Writes or updates a file in the project repository.
   */
  public static async writeFile(projectId: string, filePath: string, content: string): Promise<void> {
    let repo = await prisma.repository.findUnique({ where: { projectId } });
    if (!repo) {
      repo = await prisma.repository.create({
        data: { projectId, path: `/workspace/${projectId}` },
      });
    }

    const existing = await prisma.file.findFirst({
      where: { repositoryId: repo.id, path: filePath },
    });

    if (existing) {
      await prisma.file.update({
        where: { id: existing.id },
        data: { content, updatedAt: new Date() },
      });
    } else {
      await prisma.file.create({
        data: {
          repositoryId: repo.id,
          path: filePath,
          content,
        },
      });
    }
  }
}
