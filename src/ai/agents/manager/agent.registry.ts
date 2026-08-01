import type { IAgent } from '../core/agent.interface';
import type { AgentRole } from '../core/agent.types';
import { ProviderNotFoundError } from '../../errors/AIError';
import { CEOAgent } from '../roles/ceo.agent';
import { ArchitectAgent } from '../roles/architect.agent';
import { DeveloperAgent } from '../roles/developer.agent';
import { QAAgent } from '../roles/qa.agent';
import { DevOpsAgent } from '../roles/devops.agent';
import { DocumentationAgent } from '../roles/documentation.agent';
import { SecurityAgent } from '../roles/security.agent';
import { DesignAgent } from '../roles/ui-ux/design.agent';
import { OperationsAgent } from '../roles/operations/operations.agent';
import { ProductManagerAgent } from '../roles/product-manager/product-manager.agent';
import { ReviewerAgent } from '../roles/reviewer/reviewer.agent';
import { FrontendAgent } from '../roles/frontend.agent';
import { BackendAgent } from '../roles/backend.agent';
import { DatabaseAgent } from '../roles/database.agent';
import { ArchitectureReviewerAgent } from '../roles/architecture-reviewer.agent';
import { CodeReviewerAgent } from '../roles/code-reviewer.agent';
import { QualityReviewerAgent } from '../roles/quality-reviewer.agent';
import { ProductDiscoveryAgent } from '../roles/product-discovery.agent';
import { BusinessAnalystAgent } from '../roles/business-analyst.agent';
import { UxResearcherAgent } from '../roles/ux-researcher.agent';
import { UiDesignerAgent } from '../roles/ui-designer.agent';

const BLOCKED_ROLES: AgentRole[] = [];

const agentClasses: Record<string, new (name?: string) => IAgent> = {
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
  ARCHITECTURE_REVIEWER: ArchitectureReviewerAgent,
  CODE_REVIEWER: CodeReviewerAgent,
  QUALITY_REVIEWER: QualityReviewerAgent,
  PRODUCT_DISCOVERY: ProductDiscoveryAgent,
  BUSINESS_ANALYST: BusinessAnalystAgent,
  UX_RESEARCHER: UxResearcherAgent,
  UI_DESIGNER: UiDesignerAgent,
};


export function createAgent(role: AgentRole, name?: string): IAgent {
  if (BLOCKED_ROLES.includes(role)) {
    throw new ProviderNotFoundError(
      `Agent role "${role}" is not yet implemented.`,
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
