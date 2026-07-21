import { BaseAgent } from '../core/agent.base';
import type { AgentExecutionResult } from '../core/agent.types';

export class ArchitectAgent extends BaseAgent {
  constructor(name = 'Architect') {
    super('ARCHITECT', name);
  }

  override async execute(
    task: string,
    context?: Record<string, unknown>,
  ): Promise<AgentExecutionResult> {
    return super.execute(task, context);
  }
}
