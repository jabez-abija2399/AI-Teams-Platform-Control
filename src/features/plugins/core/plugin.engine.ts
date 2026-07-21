import { prisma } from '@/lib/prisma';
import type { PluginManifest } from '../sdk/plugin.interface';
import type { ApiResult } from '@/types/common.types';

const loadedPlugins = new Map<string, PluginManifest>();

export async function registerPlugin(manifest: PluginManifest): Promise<ApiResult<{ id: string }>> {
  const existing = await prisma.plugin.findFirst({ where: { name: manifest.name, version: manifest.version } });
  if (existing) return { success: true, data: { id: existing.id } };

  const plugin = await prisma.plugin.create({
    data: {
      name: manifest.name,
      version: manifest.version,
      author: manifest.author,
      type: manifest.type,
      status: 'REGISTERED',
      permissions: { create: manifest.requiredPermissions.map((p) => ({ permission: p })) },
    },
  });
  loadedPlugins.set(plugin.id, manifest);
  return { success: true, data: { id: plugin.id } };
}

export async function enablePlugin(pluginId: string, organizationId: string): Promise<ApiResult<null>> {
  await prisma.pluginInstallation.upsert({
    where: { pluginId_organizationId: { pluginId, organizationId } },
    create: { pluginId, organizationId, enabled: true },
    update: { enabled: true },
  });
  await prisma.plugin.update({ where: { id: pluginId }, data: { status: 'ENABLED' } });
  return { success: true, data: null };
}

export async function disablePlugin(pluginId: string, organizationId: string): Promise<ApiResult<null>> {
  await prisma.pluginInstallation.update({
    where: { pluginId_organizationId: { pluginId, organizationId } },
    data: { enabled: false },
  });
  await prisma.plugin.update({ where: { id: pluginId }, data: { status: 'DISABLED' } });
  return { success: true, data: null };
}

export async function getPlugins(organizationId?: string) {
  if (!organizationId) return prisma.plugin.findMany();
  return prisma.plugin.findMany({
    where: { installations: { some: { organizationId, enabled: true } } },
  });
}
