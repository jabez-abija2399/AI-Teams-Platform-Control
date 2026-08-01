import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { IAgent } from '@/ai/agents/core/agent.interface';
import { generateSoftwareRequirementSpec } from './business-analyst.service';
import type { ApiResult } from '@/types/common.types';
import type { SoftwareRequirementSpec } from './business-analyst.types';

export class BusinessAnalystAgent extends BaseAgent implements IAgent {
  constructor(name?: string) {
    super('BUSINESS_ANALYST', name ?? 'Business Analyst AI');
  }

  public async generateSRS(
    projectId: string,
    prd: unknown,
  ): Promise<ApiResult<SoftwareRequirementSpec>> {
    return generateSoftwareRequirementSpec(projectId, prd);
  }

  protected override buildPrompt(task: string, _context?: Record<string, unknown>): string {
    return `As Business Analyst AI, translate the following product specifications into formal Software Requirement Specifications (SRS):\n\n${task}`;
  }
}
