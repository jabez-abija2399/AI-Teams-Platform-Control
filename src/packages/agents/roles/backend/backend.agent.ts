import { BaseAgent } from '@/packages/agents/core/agent.base';
import type { IAgent } from '@/packages/agents/core/agent.interface';
import { generateBackendDesignSpec } from './backend.service';
import type { ApiResult } from '@/types/common.types';
import type { BackendDesignSpec } from './backend.types';

export class BackendAgent extends BaseAgent implements IAgent {
  constructor(name?: string) {
    super('BACKEND', name ?? 'Backend Specialist AI');
  }

  public async generateBDS(
    projectId: string,
    inputData: unknown,
  ): Promise<ApiResult<BackendDesignSpec>> {
    return generateBackendDesignSpec(projectId, inputData);
  }

  protected override buildPrompt(task: string, _context?: Record<string, unknown>): string {
    return `As Backend Specialist AI, design APIs, services, controllers, and backend infrastructure for the following task:\n\n${task}`;
  }
}
