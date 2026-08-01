import type { ExecutiveTask } from '@/core/executive/types';
import type { ExecutionState } from './types';
import { ExecutionTimelineService } from './execution-timeline.service';
import { ReviewPipeline } from './review-pipeline';
import { ExecutionContextService } from '../runtime/execution-context.service';
import { AIRuntimeEngine } from '../runtime/ai-runtime.engine';
import { MessageService } from '../workforce/communication/message.service';
import { ToolRegistry } from '../tools/tool-registry';
import { CollaborationMemoryService } from '../workforce/communication/collaboration-memory.service';
import type { CompanyRole } from '../workforce/types';

export interface ActiveWorkerSlot {
  workerId: string;
  taskId: string;
  taskTitle: string;
  agentRole: string;
  startedAt: string;
}

export class ParallelExecutionEngine {
  private static CONCURRENCY_LIMIT = 4;
  private static activeWorkers: Map<string, ActiveWorkerSlot> = new Map();

  public static getConcurrencyLimit(): number {
    return this.CONCURRENCY_LIMIT;
  }

  public static getActiveWorkers(): ActiveWorkerSlot[] {
    return Array.from(this.activeWorkers.values());
  }

  /**
   * Dispatches task to worker pool if concurrency slots are available
   */
  public static async executeTaskConcurrently(
    projectId: string,
    task: ExecutiveTask
  ): Promise<{ success: boolean; workerId?: string }> {
    if (this.activeWorkers.size >= this.CONCURRENCY_LIMIT) {
      return { success: false };
    }

    const workerId = `wrk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const slot: ActiveWorkerSlot = {
      workerId,
      taskId: task.id,
      taskTitle: task.title,
      agentRole: task.assignedAgent,
      startedAt: new Date().toISOString(),
    };

    this.activeWorkers.set(workerId, slot);

    // Deep integration: Asynchronously run context injection, prompt generation, AI Runtime, and Review Pipeline
    (async () => {
      try {
        // Notify team via messaging protocol
        await MessageService.sendMessage({
          projectId,
          senderRole: (task.assignedAgent as CompanyRole) || 'SOFTWARE_ARCHITECT',
          receiverRole: (task.reviewerAgent as CompanyRole) || 'QA_ENGINEER',
          messageType: 'REQUEST',
          content: `Starting execution on task: ${task.title}`,
          priority: 'medium',
        }).catch(() => null);

        // 1. Prepare Execution Context & System Prompt (Phase 28 Step 3 & Phase 29)
        const { systemPrompt } = await ExecutionContextService.prepareExecution(
          task.id,
          task.title,
          task.description || task.title,
          projectId
        );

        // 2. Select authorized tools for this agent role (Phase 29)
        const allowedTools = ToolRegistry.getToolsForRole(task.assignedAgent).map((t) => t.name);

        // 3. Execute task via AI Runtime Engine (Phase 29)
        const execResult = await AIRuntimeEngine.executeTask({
          projectId,
          agentRole: (task.assignedAgent as CompanyRole) || 'BACKEND_ENGINEER',
          taskId: task.id,
          taskTitle: task.title,
          taskDescription: task.description || task.title,
          systemPrompt,
          tools: allowedTools.slice(0, 3), // Pass up to 3 authorized tools
        });

        // 4. Evaluate task via Review Pipeline (Phase 27)
        ReviewPipeline.evaluateTask(task.id, task.reviewerAgent);

        // 5. Record consensus or lesson in Collaboration Memory (Phase 28 Step 4 & Phase 25)
        if (execResult.status === 'completed') {
          await CollaborationMemoryService.recordDecision(
            projectId,
            `Task Completed: ${task.title}`,
            `Executed by ${task.assignedAgent} with model ${execResult.content.split('Model: ')[1] || 'default'}. Cost: $${execResult.cost}`,
            (task.assignedAgent as CompanyRole) || 'SOFTWARE_ARCHITECT'
          ).catch(() => null);
        }

        ExecutionTimelineService.recordEntry(
          projectId,
          task.id,
          task.title,
          task.assignedAgent,
          execResult.status === 'completed' ? 'Reviewing' : 'Failed',
          `Task ${execResult.status}. Tokens: ${execResult.inputTokens + execResult.outputTokens}, Cost: $${execResult.cost}. Passed review pipeline.`
        );
      } catch (error) {
        ExecutionTimelineService.recordEntry(
          projectId,
          task.id,
          task.title,
          task.assignedAgent,
          'Failed',
          `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      } finally {
        this.activeWorkers.delete(workerId);
      }
    })();

    return { success: true, workerId };
  }
}
