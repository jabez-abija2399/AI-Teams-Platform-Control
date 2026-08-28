import { BaseAgent } from '@/packages/agents/core/agent.base';
import type { AgentExecutionResult } from '@/packages/agents/core/agent.types';

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
