import type { PipelineNode } from '../pipeline-node.interface';
import type { ExecutionContext } from '../execution-context';
import { generateProductRequirementsSpec } from '@/packages/agents/roles/product-manager/product-manager.service';
import { ExecutionStateService } from '@/core/integration/execution-state.service';
import { companyEventBus } from '@/core/company/company-event-bus';

export class PlanningNode implements PipelineNode {
  public readonly name = 'PlanningNode';

  public async execute(context: ExecutionContext): Promise<ExecutionContext> {
    const { projectId, userIdea } = context;

    ExecutionStateService.addActiveAgent(projectId, 'PRODUCT_MANAGER');
    ExecutionStateService.setMilestoneAndTask(projectId, 'Product Planning', 'Analyzing idea and writing PRD');
    await companyEventBus.publish('TASK_STARTED', projectId, { task: 'generatePRD', role: 'PRODUCT_MANAGER' }, 'PlanningNode');

    const result = await generateProductRequirementsSpec(projectId, userIdea);

    ExecutionStateService.removeActiveAgent(projectId, 'PRODUCT_MANAGER');
    ExecutionStateService.completeTask(projectId, 'generatePRD', 'PRODUCT_MANAGER');

    if (!result.success) {
      throw new Error(`Product Manager failed to generate PRD: ${result.error?.message || 'Unknown error'}`);
    }

    return {
      ...context,
      prd: result.data
    };
  }
}
