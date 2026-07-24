import { prisma } from '@/lib/prisma';

export interface ProjectSnapshotData {
  id: string;
  projectId: string;
  commitMessage: string;
  versionNumber: number;
  fileMap: Record<string, string>;
  createdAt: Date;
}

/**
 * Saves an immutable snapshot of current workspace files in an atomic database transaction.
 */
export async function saveProjectSnapshot(
  projectId: string,
  files: Record<string, string>,
  commitMessage: string
): Promise<ProjectSnapshotData> {
  return await prisma.$transaction(async (tx) => {
    // 1. Calculate next version number
    const count = await tx.projectSnapshot.count({
      where: { projectId },
    });
    const versionNumber = count + 1;

    // 2. Create snapshot record
    const snapshot = await tx.projectSnapshot.create({
      data: {
        projectId,
        commitMessage,
        versionNumber,
        fileMap: files as any,
      },
    });

    return {
      id: snapshot.id,
      projectId: snapshot.projectId,
      commitMessage: snapshot.commitMessage,
      versionNumber: snapshot.versionNumber,
      fileMap: (snapshot.fileMap as Record<string, string>) || {},
      createdAt: snapshot.createdAt,
    };
  });
}

/**
 * Reverts active workspace files back to a previous ProjectSnapshot version.
 */
export async function rollbackToSnapshot(
  projectId: string,
  snapshotId: string
): Promise<Record<string, string>> {
  const snapshot = await prisma.projectSnapshot.findFirst({
    where: {
      id: snapshotId,
      projectId,
    },
  });

  if (!snapshot) {
    throw new Error(`Snapshot ${snapshotId} not found for project ${projectId}`);
  }

  const fileMap = (snapshot.fileMap as Record<string, string>) || {};
  return fileMap;
}

/**
 * Retrieves snapshot history timeline for a project ordered by version.
 */
export async function getProjectHistory(projectId: string): Promise<ProjectSnapshotData[]> {
  const snapshots = await prisma.projectSnapshot.findMany({
    where: { projectId },
    orderBy: { versionNumber: 'desc' },
  });

  return snapshots.map((s) => ({
    id: s.id,
    projectId: s.projectId,
    commitMessage: s.commitMessage,
    versionNumber: s.versionNumber,
    fileMap: (s.fileMap as Record<string, string>) || {},
    createdAt: s.createdAt,
  }));
}
