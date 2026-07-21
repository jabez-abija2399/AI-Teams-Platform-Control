import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { AgentCapability } from '@/ai/agents/core/agent.types';

export class ArchitectAgent extends BaseAgent {
  constructor(name = 'Architect AI') {
    super('ARCHITECT', name);
    this.capabilities = ['ARCHITECTURE', 'PLANNING', 'ANALYSIS'] as AgentCapability[];
  }
}
