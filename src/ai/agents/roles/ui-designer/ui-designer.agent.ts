import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { IAgent } from '@/ai/agents/core/agent.interface';
import { generateUiDesignSpec } from './ui-designer.service';
import type { ApiResult } from '@/types/common.types';
import type { UiDesignSpec } from './ui-designer.types';

export class UiDesignerAgent extends BaseAgent implements IAgent {
  constructor(name?: string) {
    super('UI_DESIGNER', name ?? 'UI Designer AI');
  }

  public async generateUDS(
    projectId: string,
    ujw: unknown,
  ): Promise<ApiResult<UiDesignSpec>> {
    return generateUiDesignSpec(projectId, ujw);
  }

  protected override buildPrompt(task: string, _context?: Record<string, unknown>): string {
    return `As UI Designer AI, create design tokens and visual specifications for the following user journeys:\n\n${task}`;
  }
}
