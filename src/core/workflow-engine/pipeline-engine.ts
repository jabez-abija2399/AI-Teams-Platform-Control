import type { PipelineNode } from './pipeline-node.interface';
import type { ExecutionContext } from './execution-context';
import { companyEventBus } from '@/core/company/company-event-bus';
import { ExecutionStateService } from '@/core/integration/execution-state.service';
import { LifecycleManager } from '@/core/integration/lifecycle-manager';

export class PipelineEngine {
  private nodes: PipelineNode[];

  constructor(nodes: PipelineNode[]) {
    if (nodes.length === 0) {
      throw new Error('PipelineEngine requires at least one node to execute.');
    }
    this.nodes = nodes;
  }

  /**
   * Executes the pipeline nodes sequentially.
   * 
   * @param initialContext The starting context (must contain projectId and userIdea).
   */
  public async run(initialContext: ExecutionContext): Promise<ExecutionContext> {
    let context = initialContext;
    const { projectId } = context;

    try {
      ExecutionStateService.initState(projectId, 'CREATED');
      await companyEventBus.publish('PROJECT_CREATED', projectId, { userIdea: context.userIdea }, 'PipelineEngine');

      for (const node of this.nodes) {
        
        // Transition state
        const state = ExecutionStateService.getState(projectId);
        const nextPhaseName = node.name.toUpperCase().replace('NODE', '');
        await LifecycleManager.transition(projectId, state.currentPhase, nextPhaseName as any, `Starting ${node.name}`);
        ExecutionStateService.updatePhase(projectId, nextPhaseName as any);
        
        await companyEventBus.publish('NODE_STARTED', projectId, { nodeName: node.name }, 'PipelineEngine');
        
        console.log(`[PipelineEngine] Executing ${node.name}...`);
        
        try {
          context = await node.execute(context);
          await companyEventBus.publish('NODE_COMPLETED', projectId, { nodeName: node.name }, 'PipelineEngine');
        } catch (nodeError: any) {
          context.metadata.errors.push({
            node: node.name,
            message: nodeError.message || String(nodeError),
            timestamp: Date.now()
          });
          
          await companyEventBus.publish('NODE_FAILED', projectId, { nodeName: node.name, error: nodeError.message }, 'PipelineEngine');
          throw nodeError; // Halt execution if a node fails (for now)
        }
      }

      await LifecycleManager.transition(projectId, ExecutionStateService.getState(projectId).currentPhase, 'COMPLETED', 'Pipeline complete');
      ExecutionStateService.updatePhase(projectId, 'COMPLETED');
      ExecutionStateService.updateHealth(projectId, 'HEALTHY');
      await companyEventBus.publish('PROJECT_COMPLETED', projectId, { finalContext: context }, 'PipelineEngine');
      
      return context;
    } catch (err: any) {
      console.error(`[PipelineEngine] Pipeline failed for project ${projectId}:`, err);
      ExecutionStateService.updateHealth(projectId, 'FAILED', {
        message: err.message,
        code: 'PIPELINE_FAILED',
        timestamp: Date.now(),
        recoverable: false
      });
      throw err;
    }
  }
}
