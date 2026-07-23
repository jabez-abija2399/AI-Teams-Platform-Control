import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { IAgent } from '@/ai/agents/core/agent.interface';

export class ReviewerAgent extends BaseAgent implements IAgent {
  constructor(name?: string) {
    super('REVIEWER', name ?? 'Reviewer AI');
  }

  protected override buildPrompt(task: string, context?: Record<string, unknown>): string {
    return `As Reviewer AI, review the following artifact:\n\n${task}`;
  }
}
