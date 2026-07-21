import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type {
  GitRepository,
  GitBranchInfo,
  GitCommitInfo,
  GitChangeInfo,
  GitDiff,
  GitStatus,
  GitCreateCommitInput,
} from '../types';
import { createBranchSchema, createCommitSchema } from '../schemas/git.schema';

export async function createRepository(
  projectId: string,
  path: string,
): Promise<ApiResult<GitRepository>> {
  const existing = await prisma.repository.findUnique({ where: { projectId } });
  if (existing) {
    return {
      success: false,
      error: { message: 'Repository already exists for this project', code: 'CONFLICT' },
    };
  }

  const repository = await prisma.repository.create({
    data: { projectId, path },
  });

  return {
    success: true,
    data: {
      id: repository.id,
      projectId: repository.projectId,
      provider: repository.provider,
      path: repository.path,
      currentBranchId: repository.currentBranchId,
    },
  };
}

export async function getRepository(
  projectId: string,
): Promise<ApiResult<GitRepository | null>> {
  const repository = await prisma.repository.findUnique({ where: { projectId } });
  if (!repository) {
    return { success: true, data: null };
  }

  return {
    success: true,
    data: {
      id: repository.id,
      projectId: repository.projectId,
      provider: repository.provider,
      path: repository.path,
      currentBranchId: repository.currentBranchId,
    },
  };
}

export async function listBranches(
  repositoryId: string,
): Promise<ApiResult<GitBranchInfo[]>> {
  const repository = await prisma.repository.findUnique({ where: { id: repositoryId } });
  if (!repository) {
    return {
      success: false,
      error: { message: 'Repository not found', code: 'NOT_FOUND' },
    };
  }

  const branches = await prisma.gitBranch.findMany({
    where: { repositoryId },
    include: { _count: { select: { commits: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return {
    success: true,
    data: branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      type: branch.type,
      commitCount: branch._count.commits,
      isCurrent: repository.currentBranchId === branch.id,
    })),
  };
}

export async function createBranch(
  repositoryId: string,
  name: string,
  type: string = 'FEATURE',
): Promise<ApiResult<GitBranchInfo>> {
  const repository = await prisma.repository.findUnique({ where: { id: repositoryId } });
  if (!repository) {
    return {
      success: false,
      error: { message: 'Repository not found', code: 'NOT_FOUND' },
    };
  }

  const parsed = createBranchSchema.safeParse({ name, type });
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid branch data',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const existing = await prisma.gitBranch.findUnique({
    where: { repositoryId_name: { repositoryId, name: parsed.data.name } },
  });
  if (existing) {
    return {
      success: false,
      error: { message: 'Branch already exists', code: 'CONFLICT' },
    };
  }

  const branch = await prisma.gitBranch.create({
    data: {
      repositoryId,
      name: parsed.data.name,
      type: parsed.data.type,
    },
  });

  return {
    success: true,
    data: {
      id: branch.id,
      name: branch.name,
      type: branch.type,
      commitCount: 0,
      isCurrent: false,
    },
  };
}

export async function deleteBranch(
  repositoryId: string,
  branchId: string,
): Promise<ApiResult<void>> {
  const repository = await prisma.repository.findUnique({ where: { id: repositoryId } });
  if (!repository) {
    return {
      success: false,
      error: { message: 'Repository not found', code: 'NOT_FOUND' },
    };
  }

  if (repository.currentBranchId === branchId) {
    return {
      success: false,
      error: { message: 'Cannot delete the current branch', code: 'VALIDATION_ERROR' },
    };
  }

  const branch = await prisma.gitBranch.findFirst({
    where: { id: branchId, repositoryId },
  });
  if (!branch) {
    return {
      success: false,
      error: { message: 'Branch not found', code: 'NOT_FOUND' },
    };
  }

  await prisma.gitBranch.delete({ where: { id: branchId } });
  return { success: true, data: undefined };
}

export async function switchBranch(
  repositoryId: string,
  branchId: string,
): Promise<ApiResult<void>> {
  const repository = await prisma.repository.findUnique({ where: { id: repositoryId } });
  if (!repository) {
    return {
      success: false,
      error: { message: 'Repository not found', code: 'NOT_FOUND' },
    };
  }

  const branch = await prisma.gitBranch.findFirst({
    where: { id: branchId, repositoryId },
  });
  if (!branch) {
    return {
      success: false,
      error: { message: 'Branch not found', code: 'NOT_FOUND' },
    };
  }

  await prisma.repository.update({
    where: { id: repositoryId },
    data: { currentBranchId: branchId },
  });

  return { success: true, data: undefined };
}

export async function listCommits(
  repositoryId: string,
  branchId?: string,
  limit: number = 50,
): Promise<ApiResult<GitCommitInfo[]>> {
  const repository = await prisma.repository.findUnique({ where: { id: repositoryId } });
  if (!repository) {
    return {
      success: false,
      error: { message: 'Repository not found', code: 'NOT_FOUND' },
    };
  }

  const whereClause: { repositoryId: string; branchId?: string } = { repositoryId };
  if (branchId) {
    whereClause.branchId = branchId;
  }

  const commits = await prisma.gitCommit.findMany({
    where: whereClause,
    include: {
      branch: true,
      _count: { select: { changes: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return {
    success: true,
    data: commits.map((commit) => ({
      id: commit.id,
      message: commit.message,
      author: commit.author,
      branchName: commit.branch.name,
      createdAt: commit.createdAt,
      changeCount: commit._count.changes,
    })),
  };
}

export async function getCommit(
  commitId: string,
): Promise<ApiResult<GitCommitInfo>> {
  const commit = await prisma.gitCommit.findUnique({
    where: { id: commitId },
    include: {
      branch: true,
      changes: true,
      _count: { select: { changes: true } },
    },
  });

  if (!commit) {
    return {
      success: false,
      error: { message: 'Commit not found', code: 'NOT_FOUND' },
    };
  }

  return {
    success: true,
    data: {
      id: commit.id,
      message: commit.message,
      author: commit.author,
      branchName: commit.branch.name,
      createdAt: commit.createdAt,
      changeCount: commit._count.changes,
    },
  };
}

export async function listChanges(
  commitId: string,
): Promise<ApiResult<GitChangeInfo[]>> {
  const commit = await prisma.gitCommit.findUnique({ where: { id: commitId } });
  if (!commit) {
    return {
      success: false,
      error: { message: 'Commit not found', code: 'NOT_FOUND' },
    };
  }

  const changes = await prisma.gitChange.findMany({
    where: { commitId },
    orderBy: { createdAt: 'asc' },
  });

  return {
    success: true,
    data: changes.map((change) => ({
      id: change.id,
      file: change.file,
      type: change.type,
      createdAt: change.createdAt,
    })),
  };
}

export async function createCommit(
  input: GitCreateCommitInput,
): Promise<ApiResult<GitCommitInfo>> {
  const parsed = createCommitSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid commit data',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const { repositoryId, branchId, message, author, files } = parsed.data;

  const repository = await prisma.repository.findUnique({ where: { id: repositoryId } });
  if (!repository) {
    return {
      success: false,
      error: { message: 'Repository not found', code: 'NOT_FOUND' },
    };
  }

  const branch = await prisma.gitBranch.findFirst({
    where: { id: branchId, repositoryId },
  });
  if (!branch) {
    return {
      success: false,
      error: { message: 'Branch not found', code: 'NOT_FOUND' },
    };
  }

  const commit = await prisma.$transaction(async (tx) => {
    const newCommit = await tx.gitCommit.create({
      data: {
        repositoryId,
        branchId,
        message,
        author,
      },
    });

    for (const file of files) {
      const existingFile = await tx.file.findFirst({
        where: { repositoryId, path: file.path },
      });

      if (file.changeType === 'DELETE') {
        if (existingFile) {
          await tx.file.delete({ where: { id: existingFile.id } });
        }
      } else {
        if (existingFile) {
          await tx.file.update({
            where: { id: existingFile.id },
            data: { content: file.content },
          });
        } else {
          await tx.file.create({
            data: {
              repositoryId,
              path: file.path,
              content: file.content,
            },
          });
        }
      }

      await tx.gitChange.create({
        data: {
          commitId: newCommit.id,
          file: file.path,
          type: file.changeType,
        },
      });
    }

    return newCommit;
  });

  const result = await prisma.gitCommit.findUnique({
    where: { id: commit.id },
    include: {
      branch: true,
      _count: { select: { changes: true } },
    },
  });

  return {
    success: true,
    data: {
      id: result!.id,
      message: result!.message,
      author: result!.author,
      branchName: result!.branch.name,
      createdAt: result!.createdAt,
      changeCount: result!._count.changes,
    },
  };
}

export async function getDiff(
  commitId: string,
): Promise<ApiResult<GitDiff[]>> {
  const commit = await prisma.gitCommit.findUnique({
    where: { id: commitId },
    include: { changes: true },
  });

  if (!commit) {
    return {
      success: false,
      error: { message: 'Commit not found', code: 'NOT_FOUND' },
    };
  }

  const repositoryId = commit.repositoryId;
  const diffs: GitDiff[] = [];

  for (const change of commit.changes) {
    let content = '';
    let additions = 0;
    let deletions = 0;

    if (change.type !== 'DELETE') {
      const file = await prisma.file.findFirst({
        where: { repositoryId, path: change.file },
      });
      if (file) {
        content = file.content;
        additions = file.content.split('\n').length;
      }
    } else {
      const prevCommit = await prisma.gitCommit.findFirst({
        where: { repositoryId },
        orderBy: { createdAt: 'desc' },
        skip: 1,
      });

      if (prevCommit) {
        const prevChange = await prisma.gitChange.findFirst({
          where: { commitId: prevCommit.id, file: change.file },
        });
        if (prevChange) {
          const prevFile = await prisma.file.findFirst({
            where: { repositoryId, path: change.file },
          });
          if (prevFile) {
            content = prevFile.content;
            deletions = prevFile.content.split('\n').length;
          }
        }
      }
    }

    diffs.push({
      file: change.file,
      additions,
      deletions,
      content,
    });
  }

  return { success: true, data: diffs };
}

export async function getStatus(
  repositoryId: string,
): Promise<ApiResult<GitStatus>> {
  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
    include: { branches: true },
  });

  if (!repository) {
    return {
      success: false,
      error: { message: 'Repository not found', code: 'NOT_FOUND' },
    };
  }

  const currentBranch = repository.branches.find(
    (b) => b.id === repository.currentBranchId,
  );

  const latestCommit = await prisma.gitCommit.findFirst({
    where: { repositoryId },
    orderBy: { createdAt: 'desc' },
  });

  const files = await prisma.file.findMany({
    where: { repositoryId },
    select: { path: true },
  });

  const changedFiles = await prisma.gitChange.findMany({
    where: {
      commit: { repositoryId },
    },
    select: { file: true },
    orderBy: { createdAt: 'desc' },
  });

  const changedPaths = new Set(changedFiles.map((c) => c.file));
  const modified = files
    .filter((f) => changedPaths.has(f.path))
    .map((f) => f.path);
  const untracked = files
    .filter((f) => !changedPaths.has(f.path))
    .map((f) => f.path);

  return {
    success: true,
    data: {
      repositoryId,
      currentBranch: currentBranch?.name ?? 'main',
      hasChanges: modified.length > 0 || untracked.length > 0,
      ahead: latestCommit ? 1 : 0,
      behind: 0,
      staged: [],
      modified,
      untracked,
    },
  };
}
