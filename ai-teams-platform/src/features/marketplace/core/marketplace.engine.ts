import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { PluginManifest } from '@/features/plugins/sdk/plugin.interface';

interface MarketplaceItemResult {
  id: string;
  name: string;
  type: string;
  version: string;
}

export async function publish(
  name: string,
  description: string,
  type: string,
  author: string,
  version: string,
  payload: unknown,
  category?: string,
): Promise<ApiResult<MarketplaceItemResult>> {
  const existing = await prisma.marketplaceItem.findFirst({ where: { name, type } });

  let item;
  if (existing) {
    item = existing;
  } else {
    item = await prisma.marketplaceItem.create({
      data: { name, description, type, author, category },
    });
  }

  const versionRecord = await prisma.marketplaceVersion.create({
    data: {
      itemId: item.id,
      version,
      payload: JSON.parse(JSON.stringify(payload)),
    },
  });

  return {
    success: true,
    data: { id: item.id, name: item.name, type: item.type, version: versionRecord.version },
  };
}

export async function search(
  query: string,
  type?: string,
  limit: number = 20,
): Promise<ApiResult<MarketplaceItemResult[]>> {
  const items = await prisma.marketplaceItem.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' },
      ...(type ? { type } : {}),
    },
    take: limit,
    include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  return {
    success: true,
    data: items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      version: item.versions[0]?.version ?? '0.0.0',
    })),
  };
}

export async function install(
  itemId: string,
  organizationId: string,
): Promise<ApiResult<{ id: string; status: string }>> {
  const item = await prisma.marketplaceItem.findUnique({
    where: { id: itemId },
    include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  if (!item) {
    return { success: false, error: { message: 'Marketplace item not found', code: 'NOT_FOUND' } };
  }

  const latestVersion = item.versions[0];
  if (!latestVersion) {
    return { success: false, error: { message: 'No versions available', code: 'NOT_FOUND' } };
  }

  if (['AI_AGENT', 'TOOL'].includes(item.type)) {
    const { registerPlugin } = await import('@/features/plugins/core/plugin.engine');
    const { enablePlugin } = await import('@/features/plugins/core/plugin.engine');

    const pluginTypeMap: Record<string, PluginManifest['type']> = {
      AI_AGENT: 'AI_AGENT',
      TOOL: 'TOOL',
    };

    const manifest: PluginManifest = {
      id: item.id,
      name: item.name,
      version: latestVersion.version,
      author: item.author,
      type: pluginTypeMap[item.type] ?? 'TOOL',
      requiredPermissions: [],
    };

    const regResult = await registerPlugin(manifest);
    if (regResult.success) {
      await enablePlugin(regResult.data.id, organizationId);
    }
  }

  const installation = await prisma.marketplaceInstallation.upsert({
    where: { itemId_organizationId: { itemId, organizationId } },
    create: {
      itemId,
      organizationId,
      version: latestVersion.version,
      status: 'INSTALLED',
    },
    update: {
      version: latestVersion.version,
      status: 'INSTALLED',
    },
  });

  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: { downloads: { increment: 1 } },
  });

  return {
    success: true,
    data: { id: installation.id, status: installation.status },
  };
}

export async function uninstall(
  itemId: string,
  organizationId: string,
): Promise<ApiResult<null>> {
  const installation = await prisma.marketplaceInstallation.findUnique({
    where: { itemId_organizationId: { itemId, organizationId } },
  });

  if (!installation) {
    return { success: false, error: { message: 'Installation not found', code: 'NOT_FOUND' } };
  }

  await prisma.marketplaceInstallation.delete({
    where: { itemId_organizationId: { itemId, organizationId } },
  });

  return { success: true, data: null };
}

export async function update(
  itemId: string,
  organizationId: string,
  newVersion: string,
): Promise<ApiResult<{ id: string; version: string }>> {
  const installation = await prisma.marketplaceInstallation.findUnique({
    where: { itemId_organizationId: { itemId, organizationId } },
  });

  if (!installation) {
    return { success: false, error: { message: 'Installation not found', code: 'NOT_FOUND' } };
  }

  const versionRecord = await prisma.marketplaceVersion.findUnique({
    where: { itemId_version: { itemId, version: newVersion } },
  });

  if (!versionRecord) {
    return { success: false, error: { message: 'Version not found', code: 'NOT_FOUND' } };
  }

  const updated = await prisma.marketplaceInstallation.update({
    where: { itemId_organizationId: { itemId, organizationId } },
    data: { version: newVersion },
  });

  return {
    success: true,
    data: { id: updated.id, version: updated.version },
  };
}

export async function getDetails(
  itemId: string,
): Promise<ApiResult<Record<string, unknown>>> {
  const item = await prisma.marketplaceItem.findUnique({
    where: { id: itemId },
    include: {
      versions: { orderBy: { createdAt: 'desc' } },
      ratings: true,
      _count: { select: { installations: true } },
    },
  });

  if (!item) {
    return { success: false, error: { message: 'Marketplace item not found', code: 'NOT_FOUND' } };
  }

  return {
    success: true,
    data: {
      id: item.id,
      name: item.name,
      description: item.description,
      type: item.type,
      author: item.author,
      category: item.category,
      downloads: item.downloads,
      installationCount: item._count.installations,
      versions: item.versions.map((v) => ({
        version: v.version,
        changelog: v.changelog,
        createdAt: v.createdAt,
      })),
      averageRating:
        item.ratings.length > 0
          ? item.ratings.reduce((sum, r) => sum + r.score, 0) / item.ratings.length
          : null,
      ratingCount: item.ratings.length,
    },
  };
}
