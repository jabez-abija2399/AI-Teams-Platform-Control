import { BaseAgent } from '@/packages/agents/core/agent.base';
import type { AgentExecutionResult } from '@/packages/agents/core/agent.types';

export class ArchitectureReviewerAgent extends BaseAgent {
  constructor(name = 'Architecture Reviewer AI') {
    super('ARCHITECTURE_REVIEWER', name);
  }

  override async execute(
    task: string,
    context?: Record<string, unknown>,
  ): Promise<AgentExecutionResult> {
    return super.execute(task, context);
  }
}
