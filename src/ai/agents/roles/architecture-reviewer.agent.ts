import { BaseAgent } from '../core/agent.base';
import type { AgentExecutionResult } from '../core/agent.types';

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
