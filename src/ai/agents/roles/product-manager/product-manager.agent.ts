import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { IAgent } from '@/ai/agents/core/agent.interface';
import { generateProductRequirementsSpec, refineRequirements } from './product-manager.service';
import type { CEOAnalysis } from '@/ai/agents/roles/ceo/ceo.types';
import type { ApiResult } from '@/types/common.types';
import type { ProductRequirementSpec, RefinedRequirements } from './product-manager.types';

export class ProductManagerAgent extends BaseAgent implements IAgent {
  constructor(name?: string) {
    super('PRODUCT_MANAGER', name ?? 'Product Manager AI');
  }

  public async generatePRD(
    projectId: string,
    vision: unknown,
  ): Promise<ApiResult<ProductRequirementSpec>> {
    return generateProductRequirementsSpec(projectId, vision);
  }

  public async refineRequirements(
    projectId: string,
    ceoAnalysis: CEOAnalysis,
  ): Promise<ApiResult<RefinedRequirements>> {
    return refineRequirements(projectId, ceoAnalysis);
  }

  protected override buildPrompt(task: string, _context?: Record<string, unknown>): string {
    return `As Product Manager AI, refine the following CEO output into actionable specifications:\n\n${task}`;
  }
}

