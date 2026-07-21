import { BaseAgent } from '../core/agent.base';
import type { AgentExecutionResult } from '../core/agent.types';

export class DocumentationAgent extends BaseAgent {
  constructor(name = 'Technical Writer') {
    super('DOCUMENTATION', name);
  }

  override async execute(
    task: string,
    context?: Record<string, unknown>,
  ): Promise<AgentExecutionResult> {
    return super.execute(task, context);
  }
}
