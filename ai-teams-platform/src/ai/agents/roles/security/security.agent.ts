import { BaseAgent } from '@/ai/agents/core/agent.base';

export class SecurityAgent extends BaseAgent {
  constructor(name = 'Security AI') {
    super('SECURITY', name);
  }
}
