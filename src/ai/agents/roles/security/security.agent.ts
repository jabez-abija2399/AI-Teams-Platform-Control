import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { IAgent } from '@/ai/agents/core/agent.interface';
import { generateSecurityReportSpec } from './security.service';
import type { ApiResult } from '@/types/common.types';
import type { SecurityReportSpec } from './security.types';

export class SecurityAgent extends BaseAgent implements IAgent {
  constructor(name?: string) {
    super('SECURITY', name ?? 'Security Engineer');
  }

  public async generateSRS(
    projectId: string,
    inputData: unknown,
  ): Promise<ApiResult<SecurityReportSpec>> {
    return generateSecurityReportSpec(projectId, inputData);
  }

  protected override buildPrompt(task: string, _context?: Record<string, unknown>): string {
    return `As Security Engineer, perform vulnerability assessments and audit architecture for the following task:\n\n${task}`;
  }
}
