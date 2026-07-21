import { prisma } from '@/lib/prisma';
import type { PluginPermissionKey } from '../sdk/plugin.interface';

export async function validatePluginPermissions(
  pluginId: string,
  required: PluginPermissionKey[],
): Promise<{ valid: boolean; missing: string[] }> {
  const granted = await prisma.pluginPermission.findMany({ where: { pluginId } });
  const grantedSet = new Set(granted.map((g) => g.permission));
  const missing = required.filter((p) => !grantedSet.has(p));
  return { valid: missing.length === 0, missing };
}
