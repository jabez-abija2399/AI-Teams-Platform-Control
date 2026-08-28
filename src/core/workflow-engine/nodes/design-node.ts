import type { PipelineNode } from '../pipeline-node.interface';
import type { ExecutionContext } from '../execution-context';
import { generateUiDesignSpec } from '@/packages/agents/roles/ui-designer/ui-designer.service';
import { ExecutionStateService } from '@/core/integration/execution-state.service';
import { companyEventBus } from '@/core/company/company-event-bus';

export class DesignNode implements PipelineNode {
  public readonly name = 'DesignNode';

  public async execute(context: ExecutionContext): Promise<ExecutionContext> {
    const { projectId, prd, architecture } = context;

    if (!prd || !architecture) {
      throw new Error('DesignNode requires a PRD and Architecture from previous nodes.');
    }

    ExecutionStateService.addActiveAgent(projectId, 'UI_DESIGNER');
    ExecutionStateService.setMilestoneAndTask(projectId, 'UI/UX Design', 'Generating design tokens and components');
    await companyEventBus.publish('TASK_STARTED', projectId, { task: 'generateUiDesignSpec', role: 'UI_DESIGNER' }, 'DesignNode');

    const result = await generateUiDesignSpec(projectId, prd.requirements, architecture);

    ExecutionStateService.removeActiveAgent(projectId, 'UI_DESIGNER');
    ExecutionStateService.completeTask(projectId, 'generateUiDesignSpec', 'UI_DESIGNER');

    if (!result.success) {
      throw new Error(`Designer failed to generate UI specs: ${result.error?.message || 'Unknown error'}`);
    }

    return {
      ...context,
      design: result.data
    };
  }
}
