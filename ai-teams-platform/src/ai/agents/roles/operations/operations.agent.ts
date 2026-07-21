import { BaseAgent } from '@/ai/agents/core/agent.base';

export class OperationsAgent extends BaseAgent {
  constructor(name = 'Operations AI') {
    super('OPERATIONS', name);
  }
}
