import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type {
  GitIntegrationState,
  GitHubUser,
  GitHubRepo,
  CreateRepoInput,
  GitSyncStatus,
  PRInfo,
} from '../types';

const GITHUB_API = 'https://api.github.com';

async function ghFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function getIntegration(
  projectId: string,
): Promise<ApiResult<GitIntegrationState | null>> {
  const integration = await prisma.gitIntegration.findUnique({
    where: { projectId },
  });
  if (!integration) return { success: true, data: null };

  return {
    success: true,
    data: {
      id: integration.id,
      projectId: integration.projectId,
      provider: integration.provider,
      githubUsername: integration.githubUsername,
      githubUserId: integration.githubUserId,
      repoUrl: integration.repoUrl,
      repoName: integration.repoName,
      repoOwner: integration.repoOwner,
      defaultBranch: integration.defaultBranch,
      connectedAt: integration.connectedAt,
    },
  };
}

export async function connectGitHub(
  projectId: string,
  code: string,
): Promise<ApiResult<GitIntegrationState>> {
  const existing = await prisma.gitIntegration.findUnique({
    where: { projectId },
  });
  if (existing) {
    return {
      success: false,
      error: { message: 'GitHub already connected. Disconnect first.', code: 'CONFLICT' },
    };
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      success: false,
      error: { message: 'GitHub OAuth not configured on server', code: 'INTERNAL_ERROR' },
    };
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  if (!tokenRes.ok) {
    return {
      success: false,
      error: { message: 'Failed to exchange GitHub code', code: 'EXTERNAL_ERROR' },
    };
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenData.access_token) {
    return {
      success: false,
      error: { message: tokenData.error || 'No access token returned', code: 'EXTERNAL_ERROR' },
    };
  }

  const user = await ghFetch<GitHubUser>('/user', tokenData.access_token);

  const integration = await prisma.gitIntegration.create({
    data: {
      projectId,
      provider: 'github',
      accessToken: tokenData.access_token,
      githubUserId: user.id,
      githubUsername: user.login,
    },
  });

  return {
    success: true,
    data: {
      id: integration.id,
      projectId: integration.projectId,
      provider: integration.provider,
      githubUsername: integration.githubUsername,
      githubUserId: integration.githubUserId,
      repoUrl: integration.repoUrl,
      repoName: integration.repoName,
      repoOwner: integration.repoOwner,
      defaultBranch: integration.defaultBranch,
      connectedAt: integration.connectedAt,
    },
  };
}

export async function disconnectGitHub(
  projectId: string,
): Promise<ApiResult<void>> {
  const existing = await prisma.gitIntegration.findUnique({
    where: { projectId },
  });
  if (!existing) {
    return {
      success: false,
      error: { message: 'No GitHub integration found', code: 'NOT_FOUND' },
    };
  }

  await prisma.gitIntegration.delete({ where: { projectId } });
  return { success: true, data: undefined };
}

export async function createRemoteRepo(
  projectId: string,
  input: CreateRepoInput,
): Promise<ApiResult<GitHubRepo>> {
  const integration = await prisma.gitIntegration.findUnique({
    where: { projectId },
  });
  if (!integration || !integration.accessToken) {
    return {
      success: false,
      error: { message: 'GitHub not connected', code: 'NOT_FOUND' },
    };
  }

  const repo = await ghFetch<GitHubRepo>('/user/repos', integration.accessToken);
  const createRes = await fetch(`${GITHUB_API}/user/repos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${integration.accessToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      private: input.private ?? false,
      auto_init: true,
    }),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    return {
      success: false,
      error: { message: `Failed to create repo: ${body}`, code: 'EXTERNAL_ERROR' },
    };
  }

  const newRepo = (await createRes.json()) as GitHubRepo;

  const [owner, name] = newRepo.full_name.split('/');
  await prisma.gitIntegration.update({
    where: { projectId },
    data: {
      repoUrl: newRepo.html_url,
      repoName: name,
      repoOwner: owner,
      defaultBranch: newRepo.default_branch,
    },
  });

  return { success: true, data: newRepo };
}

export async function linkExistingRepo(
  projectId: string,
  repoFullName: string,
): Promise<ApiResult<void>> {
  const integration = await prisma.gitIntegration.findUnique({
    where: { projectId },
  });
  if (!integration || !integration.accessToken) {
    return {
      success: false,
      error: { message: 'GitHub not connected', code: 'NOT_FOUND' },
    };
  }

  const repo = await ghFetch<GitHubRepo>(`/repos/${repoFullName}`, integration.accessToken);

  const [owner, name] = repo.full_name.split('/');
  await prisma.gitIntegration.update({
    where: { projectId },
    data: {
      repoUrl: repo.html_url,
      repoName: name,
      repoOwner: owner,
      defaultBranch: repo.default_branch,
    },
  });

  return { success: true, data: undefined };
}

export async function listRemoteRepos(
  projectId: string,
): Promise<ApiResult<GitHubRepo[]>> {
  const integration = await prisma.gitIntegration.findUnique({
    where: { projectId },
  });
  if (!integration || !integration.accessToken) {
    return {
      success: false,
      error: { message: 'GitHub not connected', code: 'NOT_FOUND' },
    };
  }

  const repos = await ghFetch<GitHubRepo[]>(
    '/user/repos?sort=updated&per_page=30',
    integration.accessToken,
  );

  return { success: true, data: repos };
}

export async function pushToGitHub(
  projectId: string,
  commitMessage: string,
  branch: string = 'main',
): Promise<ApiResult<{ sha: string }>> {
  const integration = await prisma.gitIntegration.findUnique({
    where: { projectId },
  });
  if (!integration || !integration.accessToken || !integration.repoOwner || !integration.repoName) {
    return {
      success: false,
      error: { message: 'GitHub not connected or no repo linked', code: 'NOT_FOUND' },
    };
  }

  const repoPath = `${integration.repoOwner}/${integration.repoName}`;

  const files = await prisma.file.findMany({
    where: { repository: { projectId } },
  });

  const getRef = await ghFetch<{ object: { sha: string } }>(
    `/repos/${repoPath}/git/ref/heads/${branch}`,
    integration.accessToken,
  ).catch(() => null);

  let baseSha = getRef?.object?.sha;

  if (!baseSha) {
    const createRef = await fetch(`${GITHUB_API}/repos/${repoPath}/git/refs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${integration.accessToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: '0000000000000000000000000000000000000000' }),
    });
    if (!createRef.ok) {
      return {
        success: false,
        error: { message: 'Failed to create branch', code: 'EXTERNAL_ERROR' },
      };
    }
    baseSha = (await createRef.json() as { object: { sha: string } }).object.sha;
  }

  const treeItems = files.map((f) => ({
    path: f.path,
    mode: '100644' as const,
    type: 'blob' as const,
    content: f.content,
  }));

  const createTree = await fetch(`${GITHUB_API}/repos/${repoPath}/git/trees`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${integration.accessToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ base_tree: baseSha, tree: treeItems }),
  });

  if (!createTree.ok) {
    return {
      success: false,
      error: { message: 'Failed to create tree', code: 'EXTERNAL_ERROR' },
    };
  }
  const tree = (await createTree.json()) as { sha: string };

  const createCommit = await fetch(`${GITHUB_API}/repos/${repoPath}/git/commits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${integration.accessToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      message: commitMessage,
      tree: tree.sha,
      parents: [baseSha],
    }),
  });

  if (!createCommit.ok) {
    return {
      success: false,
      error: { message: 'Failed to create commit', code: 'EXTERNAL_ERROR' },
    };
  }
  const commit = (await createCommit.json()) as { sha: string };

  const updateRef = await fetch(`${GITHUB_API}/repos/${repoPath}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${integration.accessToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ sha: commit.sha, force: true }),
  });

  if (!updateRef.ok) {
    return {
      success: false,
      error: { message: 'Failed to update ref', code: 'EXTERNAL_ERROR' },
    };
  }

  return { success: true, data: { sha: commit.sha } };
}

export async function pullFromGitHub(
  projectId: string,
  branch: string = 'main',
): Promise<ApiResult<{ files: number }>> {
  const integration = await prisma.gitIntegration.findUnique({
    where: { projectId },
  });
  if (!integration || !integration.accessToken || !integration.repoOwner || !integration.repoName) {
    return {
      success: false,
      error: { message: 'GitHub not connected or no repo linked', code: 'NOT_FOUND' },
    };
  }

  const repoPath = `${integration.repoOwner}/${integration.repoName}`;

  const repoFiles = await ghFetch<Array<{ path: string; content?: string; sha: string; type?: string }>>(
    `/repos/${repoPath}/contents?ref=${branch}`,
    integration.accessToken,
  );

  let count = 0;
  const repository = await prisma.repository.findUnique({ where: { projectId } });
  if (!repository) {
    return {
      success: false,
      error: { message: 'No local repository', code: 'NOT_FOUND' },
    };
  }

  for (const file of repoFiles) {
    if (file.type !== 'file' || !file.content) continue;
    const decoded = atob(file.content);

    const existing = await prisma.file.findFirst({
      where: { repositoryId: repository.id, path: file.path },
    });

    if (existing) {
      await prisma.file.update({
        where: { id: existing.id },
        data: { content: decoded },
      });
    } else {
      await prisma.file.create({
        data: { repositoryId: repository.id, path: file.path, content: decoded },
      });
    }
    count++;
  }

  return { success: true, data: { files: count } };
}

export async function getSyncStatus(
  projectId: string,
): Promise<ApiResult<GitSyncStatus>> {
  const integration = await prisma.gitIntegration.findUnique({
    where: { projectId },
  });

  return {
    success: true,
    data: {
      ahead: 0,
      behind: 0,
      synced: !!integration?.repoUrl,
      lastSyncAt: integration?.updatedAt ?? null,
    },
  };
}

export async function createPullRequest(
  projectId: string,
  title: string,
  body: string,
  head: string,
  base: string = 'main',
): Promise<ApiResult<PRInfo>> {
  const integration = await prisma.gitIntegration.findUnique({
    where: { projectId },
  });
  if (!integration || !integration.accessToken || !integration.repoOwner || !integration.repoName) {
    return {
      success: false,
      error: { message: 'GitHub not connected or no repo linked', code: 'NOT_FOUND' },
    };
  }

  const repoPath = `${integration.repoOwner}/${integration.repoName}`;
  const res = await fetch(`${GITHUB_API}/repos/${repoPath}/pulls`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${integration.accessToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ title, body, head, base }),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      success: false,
      error: { message: `Failed to create PR: ${text}`, code: 'EXTERNAL_ERROR' },
    };
  }

  const pr = (await res.json()) as {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: string;
    head: { ref: string };
    base: { ref: string };
    merged_at: string | null;
    created_at: string;
  };

  const saved = await prisma.pullRequest.create({
    data: {
      projectId,
      integrationId: integration.id,
      number: pr.number,
      title: pr.title,
      body: pr.body,
      state: pr.state === 'open' ? 'OPEN' : pr.state === 'closed' ? 'CLOSED' : 'MERGED',
      headBranch: pr.head.ref,
      baseBranch: pr.base.ref,
      mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
    },
  });

  return {
    success: true,
    data: {
      id: saved.id,
      number: saved.number,
      title: saved.title,
      body: saved.body,
      state: saved.state,
      headBranch: saved.headBranch,
      baseBranch: saved.baseBranch,
      mergedAt: saved.mergedAt,
      createdAt: saved.createdAt,
    },
  };
}
