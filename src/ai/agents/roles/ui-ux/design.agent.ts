import { BaseAgent } from '@/ai/agents/core/agent.base';

export class DesignAgent extends BaseAgent {
  constructor(name = 'UI/UX AI') {
    super('UI_UX', name);
  }
}
