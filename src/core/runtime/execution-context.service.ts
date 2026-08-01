import type { AgentExecutionContext } from '../workforce/context/context.types';
import { ContextInjectorService } from '../workforce/context/context-injector.service';
import { AgentPromptEngine } from '../workforce/prompt/agent-prompt.engine';

export class ExecutionContextService {
  /**
   * Assembles full execution context + system prompt for a task
   */
  public static async prepareExecution(
    taskId: string,
    taskTitle: string,
    taskDescription: string,
    projectId?: string
  ): Promise<{ context: AgentExecutionContext; systemPrompt: string; contextTokens: number }> {
    const context = await ContextInjectorService.injectContextForTask(
      taskId,
      taskTitle,
      taskDescription,
      projectId
    );

    const promptResult = await AgentPromptEngine.generatePrompt(context, projectId);

    return {
      context,
      systemPrompt: promptResult.systemPrompt,
      contextTokens: promptResult.contextTokens,
    };
  }
}
