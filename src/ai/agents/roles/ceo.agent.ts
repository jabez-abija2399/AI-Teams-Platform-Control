import { BaseAgent } from '../core/agent.base';
import type { AgentExecutionResult } from '../core/agent.types';

export class CEOAgent extends BaseAgent {
  constructor(name = 'CEO') {
    super('CEO', name);
  }

  override async execute(
    task: string,
    context?: Record<string, unknown>,
  ): Promise<AgentExecutionResult> {
    return super.execute(task, context);
  }
}
