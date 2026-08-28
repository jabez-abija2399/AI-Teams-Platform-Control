import type { PipelineNode } from '../pipeline-node.interface';
import type { ExecutionContext } from '../execution-context';
import { designArchitecture } from '@/packages/agents/roles/architect/architect.service';
import { ExecutionStateService } from '@/core/integration/execution-state.service';
import { companyEventBus } from '@/core/company/company-event-bus';

export class ArchitectureNode implements PipelineNode {
  public readonly name = 'ArchitectureNode';

  public async execute(context: ExecutionContext): Promise<ExecutionContext> {
    const { projectId, prd } = context;

    if (!prd) {
      throw new Error('ArchitectureNode requires a PRD from the PlanningNode.');
    }

    ExecutionStateService.addActiveAgent(projectId, 'ARCHITECT');
    ExecutionStateService.setMilestoneAndTask(projectId, 'System Architecture', 'Designing tech stack and models');
    await companyEventBus.publish('TASK_STARTED', projectId, { task: 'designArchitecture', role: 'ARCHITECT' }, 'ArchitectureNode');

    // Extract architect inputs from the PRD
    const architectInput = {
      features: prd.requirements?.features?.map((f: any) => ({ name: f.name, description: f.description })) || [],
      userStories: prd.requirements?.userStories?.map((u: any) => ({ as: u.asA, iWant: u.iWant, soThat: u.soThat, priority: u.priority })) || [],
      priorities: prd.requirements?.priorities || [],
      constraints: prd.requirements?.constraints || []
    };

    const result = await designArchitecture(projectId, architectInput);

    ExecutionStateService.removeActiveAgent(projectId, 'ARCHITECT');
    ExecutionStateService.completeTask(projectId, 'designArchitecture', 'ARCHITECT');

    if (!result.success) {
      throw new Error(`Architect failed to generate system architecture: ${result.error?.message || 'Unknown error'}`);
    }

    return {
      ...context,
      architecture: result.data
    };
  }
}
