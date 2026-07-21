import { prisma } from '@/lib/prisma';

type AgentRole = 'CEO' | 'ARCHITECT' | 'DEVELOPER' | 'QA' | 'UI_UX' | 'DEVOPS' | 'DOCUMENTATION' | 'SECURITY' | 'OPERATIONS';

export interface PermissionAuditFinding {
  type: 'EXCESS_PERMISSION' | 'MISSING_PERMISSION' | 'OVERRIDED_DEFAULT';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  agentId: string;
  agentName: string;
  resource: string;
  action: string;
  description: string;
}

interface RoleDefaults {
  allowedResources: string[];
  deniedResources: string[];
  defaultActions: Record<string, string[]>;
}

const ROLE_DEFAULTS: Record<AgentRole, RoleDefaults> = {
  CEO: {
    allowedResources: ['project', 'task', 'team', 'budget', 'report'],
    deniedResources: ['code', 'database'],
    defaultActions: {
      project: ['read', 'update'],
      task: ['read', 'create', 'update', 'delete'],
      team: ['read', 'create', 'update'],
      budget: ['read', 'update'],
      report: ['read', 'create'],
    },
  },
  ARCHITECT: {
    allowedResources: ['project', 'task', 'code', 'database', 'architecture'],
    deniedResources: ['budget', 'billing'],
    defaultActions: {
      project: ['read', 'update'],
      task: ['read', 'create', 'update'],
      code: ['read', 'create', 'update', 'delete'],
      database: ['read', 'create', 'update'],
      architecture: ['read', 'create', 'update'],
    },
  },
  DEVELOPER: {
    allowedResources: ['project', 'task', 'code'],
    deniedResources: ['budget', 'billing', 'team', 'architecture'],
    defaultActions: {
      project: ['read'],
      task: ['read', 'update'],
      code: ['read', 'create', 'update', 'delete'],
    },
  },
  QA: {
    allowedResources: ['project', 'task', 'code', 'test'],
    deniedResources: ['budget', 'billing', 'team'],
    defaultActions: {
      project: ['read'],
      task: ['read', 'update'],
      code: ['read'],
      test: ['read', 'create', 'update', 'delete'],
    },
  },
  UI_UX: {
    allowedResources: ['project', 'task', 'design'],
    deniedResources: ['budget', 'billing', 'database', 'code'],
    defaultActions: {
      project: ['read'],
      task: ['read', 'update'],
      design: ['read', 'create', 'update'],
    },
  },
  DEVOPS: {
    allowedResources: ['project', 'task', 'deployment', 'infrastructure', 'code'],
    deniedResources: ['budget', 'billing'],
    defaultActions: {
      project: ['read'],
      task: ['read', 'update'],
      deployment: ['read', 'create', 'update', 'delete'],
      infrastructure: ['read', 'create', 'update'],
      code: ['read', 'update'],
    },
  },
  DOCUMENTATION: {
    allowedResources: ['project', 'task', 'document'],
    deniedResources: ['budget', 'billing', 'database', 'deployment'],
    defaultActions: {
      project: ['read'],
      task: ['read'],
      document: ['read', 'create', 'update'],
    },
  },
  SECURITY: {
    allowedResources: ['project', 'task', 'code', 'security', 'audit'],
    deniedResources: ['budget', 'billing'],
    defaultActions: {
      project: ['read'],
      task: ['read', 'create', 'update'],
      code: ['read'],
      security: ['read', 'create', 'update', 'delete'],
      audit: ['read', 'create'],
    },
  },
  OPERATIONS: {
    allowedResources: ['project', 'task', 'deployment', 'monitoring'],
    deniedResources: ['budget', 'billing', 'code'],
    defaultActions: {
      project: ['read'],
      task: ['read', 'update'],
      deployment: ['read', 'create', 'update'],
      monitoring: ['read', 'create', 'update'],
    },
  },
};

function getRoleDefaults(role: AgentRole): RoleDefaults {
  return ROLE_DEFAULTS[role];
}

export async function auditAgentPermissions(): Promise<PermissionAuditFinding[]> {
  const agents = await prisma.agent.findMany({
    include: { permissions: true },
  });

  const findings: PermissionAuditFinding[] = [];

  for (const agent of agents) {
    const defaults = getRoleDefaults(agent.role);

    for (const perm of agent.permissions) {
      const isDenied = defaults.deniedResources.includes(perm.resource);

      if (isDenied) {
        findings.push({
          type: 'EXCESS_PERMISSION',
          severity: 'HIGH',
          agentId: agent.id,
          agentName: agent.name,
          resource: perm.resource,
          action: perm.action,
          description: `${agent.name} (${agent.role}) has permission for ${perm.action} on ${perm.resource}, which is not allowed for this role`,
        });
        continue;
      }

      const allowedActions = defaults.defaultActions[perm.resource] ?? [];
      if (allowedActions.length > 0 && !allowedActions.includes(perm.action)) {
        findings.push({
          type: 'EXCESS_PERMISSION',
          severity: 'MEDIUM',
          agentId: agent.id,
          agentName: agent.name,
          resource: perm.resource,
          action: perm.action,
          description: `${agent.name} (${agent.role}) has non-standard action ${perm.action} on ${perm.resource} (default: ${allowedActions.join(', ')})`,
        });
      }
    }

    for (const [resource, actions] of Object.entries(defaults.defaultActions)) {
      if (defaults.deniedResources.includes(resource)) continue;

      for (const action of actions) {
        const hasPermission = agent.permissions.some(
          (p) => p.resource === resource && p.action === action,
        );

        if (!hasPermission && action === 'read') {
          findings.push({
            type: 'MISSING_PERMISSION',
            severity: 'MEDIUM',
            agentId: agent.id,
            agentName: agent.name,
            resource,
            action,
            description: `${agent.name} (${agent.role}) is missing default read access for ${resource}`,
          });
        }
      }
    }
  }

  return findings;
}

export async function auditMemberPermissions(organizationId: string): Promise<PermissionAuditFinding[]> {
  const memberships = await prisma.membership.findMany({
    where: { organizationId },
    include: { permissions: true, user: true, agent: true },
  });

  const findings: PermissionAuditFinding[] = [];

  const sensitiveResources = ['billing', 'organization', 'admin', 'member'];
  const adminActions = ['delete', 'update', 'manage'];

  for (const membership of memberships) {
    const label = membership.user?.name ?? membership.agent?.name ?? membership.id;
    const agentId = membership.agentId ?? membership.id;

    for (const perm of membership.permissions) {
      if (perm.permission.includes(':')) {
        const parts = perm.permission.split(':');
        const resource = parts[0] ?? '';
        const action = parts[1] ?? '';

        if (sensitiveResources.includes(resource) && adminActions.includes(action)) {
          findings.push({
            type: 'EXCESS_PERMISSION',
            severity: 'HIGH',
            agentId,
            agentName: label,
            resource,
            action,
            description: `Member "${label}" has admin-level permission "${perm.permission}" which may be excessive`,
          });
        }
      }
    }
  }

  return findings;
}
