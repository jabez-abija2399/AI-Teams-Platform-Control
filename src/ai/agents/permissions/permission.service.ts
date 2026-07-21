import type { AgentRole } from '../core/agent.types';

export type PermissionAction = 'read' | 'write' | 'execute' | 'approve';

export interface PermissionRule {
  id: string;
  role: AgentRole;
  resource: string;
  actions: PermissionAction[];
  conditions?: Record<string, unknown>;
  grantedAt: Date;
}

const permissionStore: PermissionRule[] = [];

export function grantPermission(
  role: AgentRole,
  resource: string,
  actions: PermissionAction[],
): PermissionRule {
  const rule: PermissionRule = {
    id: crypto.randomUUID(),
    role,
    resource,
    actions,
    grantedAt: new Date(),
  };
  permissionStore.push(rule);
  return rule;
}

export function checkPermission(
  role: AgentRole,
  resource: string,
  action: PermissionAction,
): boolean {
  return permissionStore.some(
    (rule) => rule.role === role && rule.resource === resource && rule.actions.includes(action),
  );
}

export function getPermissionsForRole(role: AgentRole): PermissionRule[] {
  return permissionStore.filter((rule) => rule.role === role);
}

export function revokePermission(id: string): boolean {
  const index = permissionStore.findIndex((rule) => rule.id === id);
  if (index === -1) return false;
  permissionStore.splice(index, 1);
  return true;
}
