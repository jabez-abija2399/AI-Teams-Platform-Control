import { BaseAgent } from '../core/agent.base';
import type { AgentExecutionResult } from '../core/agent.types';

export class DeveloperAgent extends BaseAgent {
  constructor(name = 'Developer') {
    super('DEVELOPER', name);
  }

  override async execute(
    task: string,
    context?: Record<string, unknown>,
  ): Promise<AgentExecutionResult> {
    return super.execute(task, context);
  }
}
