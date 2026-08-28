import type { AgentRole } from '@/packages/agents/core/agent.types';
import { getWorkflow } from '../../core/workflow-engine/workflow.registry';

export interface SelectedWorkflowResult {
  workflowId: string;
  workflowName: string;
  agents: AgentRole[];
  reason: string;
}

export function selectWorkflowForInput(input: string): SelectedWorkflowResult {
  const lower = input.toLowerCase();

  const simpleKeywords = ['landing page', 'portfolio', 'simple website', 'personal website', 'blog', 'static site', 'one page'];
  const isSimple = simpleKeywords.some((kw) => lower.includes(kw));

  if (isSimple) {
    const preset = getWorkflow('SIMPLE_WEBSITE');
    const agents: AgentRole[] = ['CEO', 'FRONTEND', 'QA'];
    return {
      workflowId: 'SIMPLE_WEBSITE',
      workflowName: preset?.name ?? 'Simple Website Workflow',
      agents,
      reason: 'Input specifies a straightforward web page or portfolio requiring streamlined execution without complex backend/database overhead.',
    };
  }

  // Default to enterprise / large SaaS for complex applications like banking platforms, inventory management, etc.
  const preset = getWorkflow('LARGE_SAAS');
  const agents: AgentRole[] = ['CEO', 'PRODUCT_MANAGER', 'ARCHITECT', 'DATABASE', 'BACKEND', 'FRONTEND', 'SECURITY', 'QA', 'DEVOPS'];
  return {
    workflowId: 'LARGE_SAAS',
    workflowName: preset?.name ?? 'Enterprise SaaS Workflow',
    agents,
    reason: 'Input specifies a complex multi-layered application (e.g. SaaS, banking, inventory) requiring complete architectural, database, security, and DevOps oversight.',
  };
}
