import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { AgentCapability } from '@/ai/agents/core/agent.types';

export class CEOAgent extends BaseAgent {
  constructor(name = 'CEO AI') {
    super('CEO', name);
    this.capabilities = ['PLANNING', 'ANALYSIS', 'DOCUMENTATION'] as AgentCapability[];
  }
}
