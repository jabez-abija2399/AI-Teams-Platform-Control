import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';

export async function createEncryptedGitIntegration(data: {
  projectId: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  githubUserId?: number;
  githubUsername?: string;
  repoUrl?: string;
  repoName?: string;
  repoOwner?: string;
  defaultBranch?: string;
}) {
  const encryptedToken = encrypt(data.accessToken);
  const encryptedRefreshToken = data.refreshToken ? encrypt(data.refreshToken) : undefined;

  return prisma.gitIntegration.create({
    data: {
      projectId: data.projectId,
      provider: data.provider,
      accessToken: encryptedToken,
      refreshToken: encryptedRefreshToken,
      githubUserId: data.githubUserId,
      githubUsername: data.githubUsername,
      repoUrl: data.repoUrl,
      repoName: data.repoName,
      repoOwner: data.repoOwner,
      defaultBranch: data.defaultBranch ?? 'main',
    },
  });
}

export async function getDecryptedGitIntegration(projectId: string) {
  const integration = await prisma.gitIntegration.findUnique({
    where: { projectId },
  });

  if (!integration) return null;

  let decryptedToken: string | undefined;
  let decryptedRefreshToken: string | undefined;

  try {
    decryptedToken = decrypt(integration.accessToken);
  } catch {
    decryptedToken = integration.accessToken;
  }

  if (integration.refreshToken) {
    try {
      decryptedRefreshToken = decrypt(integration.refreshToken);
    } catch {
      decryptedRefreshToken = integration.refreshToken;
    }
  }

  return {
    ...integration,
    accessToken: decryptedToken,
    refreshToken: decryptedRefreshToken,
  };
}

export async function updateEncryptedGitIntegration(
  projectId: string,
  data: Partial<{
    accessToken: string;
    refreshToken: string;
    githubUserId: number;
    githubUsername: string;
    repoUrl: string;
    repoName: string;
    repoOwner: string;
    defaultBranch: string;
  }>,
) {
  const updateData: Record<string, unknown> = {};

  if (data.accessToken !== undefined) {
    updateData.accessToken = encrypt(data.accessToken);
  }
  if (data.refreshToken !== undefined) {
    updateData.refreshToken = encrypt(data.refreshToken);
  }
  if (data.githubUserId !== undefined) updateData.githubUserId = data.githubUserId;
  if (data.githubUsername !== undefined) updateData.githubUsername = data.githubUsername;
  if (data.repoUrl !== undefined) updateData.repoUrl = data.repoUrl;
  if (data.repoName !== undefined) updateData.repoName = data.repoName;
  if (data.repoOwner !== undefined) updateData.repoOwner = data.repoOwner;
  if (data.defaultBranch !== undefined) updateData.defaultBranch = data.defaultBranch;

  return prisma.gitIntegration.update({
    where: { projectId },
    data: updateData,
  });
}