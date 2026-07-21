import type { IAgent } from '../core/agent.interface';
import type { AgentRole } from '../core/agent.types';
import { ProviderNotFoundError } from '../../errors/AIError';
import { CEOAgent } from '../roles/ceo.agent';
import { ArchitectAgent } from '../roles/architect.agent';
import { DeveloperAgent } from '../roles/developer.agent';
import { QAAgent } from '../roles/qa.agent';
import { DevOpsAgent } from '../roles/devops.agent';
import { DocumentationAgent } from '../roles/documentation.agent';
import { SecurityAgent } from '../roles/security/security.agent';
import { DesignAgent } from '../roles/ui-ux/design.agent';
import { OperationsAgent } from '../roles/operations/operations.agent';

const BLOCKED_ROLES: AgentRole[] = [];

const agentClasses: Record<string, new (name?: string) => IAgent> = {
  CEO: CEOAgent,
  ARCHITECT: ArchitectAgent,
  DEVELOPER: DeveloperAgent,
  QA: QAAgent,
  UI_UX: DesignAgent,
  DEVOPS: DevOpsAgent,
  DOCUMENTATION: DocumentationAgent,
  SECURITY: SecurityAgent,
  OPERATIONS: OperationsAgent,
};

export function createAgent(role: AgentRole, name?: string): IAgent {
  if (BLOCKED_ROLES.includes(role)) {
    throw new ProviderNotFoundError(
      `Agent role "${role}" is not yet implemented. Only CEO, ARCHITECT, DEVELOPER, QA are available.`,
    );
  }

  const AgentClass = agentClasses[role];
  if (!AgentClass) {
    throw new ProviderNotFoundError(`No agent class registered for role "${role}"`);
  }

  return new AgentClass(name);
}

export function getAvailableRoles(): AgentRole[] {
  return Object.keys(agentClasses) as AgentRole[];
}
