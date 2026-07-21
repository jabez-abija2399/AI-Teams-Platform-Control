import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { AgentCapability } from '@/ai/agents/core/agent.types';

export class DeveloperAgent extends BaseAgent {
  constructor(name = 'Developer AI') {
    super('DEVELOPER', name);
    this.capabilities = ['CODING', 'DEBUGGING', 'IMPLEMENTATION'] as AgentCapability[];
  }
}
