import type { IAgent } from '../core/agent.interface';
import type { AgentRole } from '../core/agent.types';
import { ProviderNotFoundError } from '@/ai/errors/AIError';
import {
  CeoAgent as CEOAgent,
  ArchitectAgent,
  DeveloperAgent,
  QaEngineerAgent as QAAgent,
  DevopsEngineerAgent as DevOpsAgent,
  DocumentationAgent,
  SecurityAuditorAgent as SecurityAgent,
  UIDesignerAgent as DesignAgent,
  OperationsAgent,
  ProductManagerAgent,
  ReviewerAgent,
  FrontendAgent,
  BackendAgent,
  DatabaseAgent,
  ProductDiscoveryAgent,
  BusinessAnalystAgent,
  UxResearcherAgent,
  UIDesignerAgent,
} from '@/packages/agents/roles';

const BLOCKED_ROLES: AgentRole[] = [];

const agentClasses: Record<string, any> = {
  CEO: CEOAgent,
  ARCHITECT: ArchitectAgent,
  DEVELOPER: DeveloperAgent,
  QA: QAAgent,
  PRODUCT_MANAGER: ProductManagerAgent,
  REVIEWER: ReviewerAgent,
  UI_UX: DesignAgent,
  DEVOPS: DevOpsAgent,
  DOCUMENTATION: DocumentationAgent,
  SECURITY: SecurityAgent,
  OPERATIONS: OperationsAgent,
  FRONTEND: FrontendAgent,
  BACKEND: BackendAgent,
  DATABASE: DatabaseAgent,
  ARCHITECTURE_REVIEWER: ReviewerAgent,
  CODE_REVIEWER: ReviewerAgent,
  QUALITY_REVIEWER: ReviewerAgent,
  PRODUCT_DISCOVERY: ProductDiscoveryAgent,
  BUSINESS_ANALYST: BusinessAnalystAgent,
  UX_RESEARCHER: UxResearcherAgent,
  UI_DESIGNER: UIDesignerAgent,
};

export function createAgent(role: AgentRole, name?: string): any {
  if (BLOCKED_ROLES.includes(role)) {
    throw new ProviderNotFoundError(
      `Agent role "${role}" is not yet implemented.`,
    );
  }

  const AgentClass = agentClasses[role];
  if (!AgentClass) {
    throw new ProviderNotFoundError(`Agent role "${role}" not found in registry.`);
  }

  const agent = new AgentClass(name);
  if (agent) {
    agent.role = role;
    if (name) agent.name = name;
  }
  return agent;
}

export function registerAgent(
  role: AgentRole,
  agentClass: new (name?: string) => any,
): void {
  agentClasses[role] = agentClass;
}

export function getRegisteredRoles(): AgentRole[] {
  return Object.keys(agentClasses).filter(
    (role) => !BLOCKED_ROLES.includes(role as AgentRole),
  ) as AgentRole[];
}

export const getAvailableRoles = getRegisteredRoles;
