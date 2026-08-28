import { BaseAgent } from '@/packages/agents/core/agent.base';
import type { IAgent } from '@/packages/agents/core/agent.interface';
import { generateUxResearchSpec } from './ux-researcher.service';
import type { ApiResult } from '@/types/common.types';
import type { UxResearchSpec } from './ux-researcher.types';

export class UxResearcherAgent extends BaseAgent implements IAgent {
  constructor(name?: string) {
    super('UX_RESEARCHER', name ?? 'UX Researcher AI');
  }

  public async generateUJW(
    projectId: string,
    prd: unknown,
  ): Promise<ApiResult<UxResearchSpec>> {
    return generateUxResearchSpec(projectId, prd);
  }

  protected override buildPrompt(task: string, _context?: Record<string, unknown>): string {
    return `As UX Researcher AI, map user journeys and information architecture for the following project requirements:\n\n${task}`;
  }
}
