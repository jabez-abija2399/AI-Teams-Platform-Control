import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { IAgent } from '@/ai/agents/core/agent.interface';

export class ProductManagerAgent extends BaseAgent implements IAgent {
  constructor(name?: string) {
    super('PRODUCT_MANAGER', name ?? 'Product Manager AI');
  }

  protected override buildPrompt(task: string, context?: Record<string, unknown>): string {
    return `As Product Manager AI, refine the following CEO output into actionable specifications:\n\n${task}`;
  }
}
