import { BaseAgent } from '../core/agent.base';
import type { AgentExecutionResult } from '../core/agent.types';

export class QAAgent extends BaseAgent {
  constructor(name = 'QA') {
    super('QA', name);
  }

  override async execute(
    task: string,
    context?: Record<string, unknown>,
  ): Promise<AgentExecutionResult> {
    return super.execute(task, context);
  }
}
