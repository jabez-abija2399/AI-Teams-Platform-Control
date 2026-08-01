import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { IAgent } from '@/ai/agents/core/agent.interface';
import { generateQaReportSpec } from './qa.service';
import type { ApiResult } from '@/types/common.types';
import type { QaReportSpec } from './qa.types';

export class QAAgent extends BaseAgent implements IAgent {
  constructor(name?: string) {
    super('QA', name ?? 'Quality Assurance Engineer');
  }

  public async generateQRS(
    projectId: string,
    inputData: unknown,
  ): Promise<ApiResult<QaReportSpec>> {
    return generateQaReportSpec(projectId, inputData);
  }

  protected override buildPrompt(task: string, _context?: Record<string, unknown>): string {
    return `As Quality Assurance Engineer, audit implementations and generate test plans for the following task:\n\n${task}`;
  }
}
