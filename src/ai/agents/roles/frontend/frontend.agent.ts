import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { IAgent } from '@/ai/agents/core/agent.interface';
import { generateFrontendDesignSpec } from './frontend.service';
import type { ApiResult } from '@/types/common.types';
import type { FrontendDesignSpec } from './frontend.types';

export class FrontendAgent extends BaseAgent implements IAgent {
  constructor(name?: string) {
    super('FRONTEND', name ?? 'Frontend Specialist AI');
  }

  public async generateFDS(
    projectId: string,
    inputData: unknown,
  ): Promise<ApiResult<FrontendDesignSpec>> {
    return generateFrontendDesignSpec(projectId, inputData);
  }

  protected override buildPrompt(task: string, _context?: Record<string, unknown>): string {
    return `As Frontend Specialist AI, design components, state stores, and client layouts for the following task:\n\n${task}`;
  }
}
