import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { IAgent } from '@/ai/agents/core/agent.interface';
import { generateDevopsPlanSpec } from './devops.service';
import type { ApiResult } from '@/types/common.types';
import type { DevopsPlanSpec } from './devops.types';

export class DevOpsAgent extends BaseAgent implements IAgent {
  constructor(name?: string) {
    super('DEVOPS', name ?? 'DevOps');
  }

  public async generateDPS(
    projectId: string,
    inputData: unknown,
  ): Promise<ApiResult<DevopsPlanSpec>> {
    return generateDevopsPlanSpec(projectId, inputData);
  }

  protected override buildPrompt(task: string, _context?: Record<string, unknown>): string {
    return `As DevOps Engineer, design deployment pipelines and infrastructure for the following task:\n\n${task}`;
  }
}
