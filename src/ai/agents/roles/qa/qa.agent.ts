import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { AgentCapability } from '@/ai/agents/core/agent.types';

export class QAAgent extends BaseAgent {
  constructor(name = 'QA AI') {
    super('QA', name);
    this.capabilities = ['TESTING', 'ANALYSIS'] as AgentCapability[];
  }
}
