import type { AIModelConfig } from './runtime.types';
import { TokenTrackerService } from './token-tracker.service';

const projectCosts = new Map<string, { totalCost: number; executionCosts: Array<{ executionId: string; cost: number }> }>();

export class CostTrackerService {
  /**
   * Calculates cost from token usage and model pricing
   */
  public static calculateCost(
    modelConfig: AIModelConfig,
    inputTokens: number,
    outputTokens: number
  ): number {
    const inputCost = inputTokens * modelConfig.costPerInputToken;
    const outputCost = outputTokens * modelConfig.costPerOutputToken;
    return Number((inputCost + outputCost).toFixed(6));
  }

  /**
   * Records cost for a specific execution
   */
  public static recordCost(projectId: string, executionId: string, cost: number): void {
    const existing = projectCosts.get(projectId) || { totalCost: 0, executionCosts: [] };
    existing.totalCost += cost;
    existing.executionCosts.push({ executionId, cost });
    projectCosts.set(projectId, existing);
  }

  /**
   * Gets total cost for a project
   */
  public static getProjectCost(projectId: string): number {
    return projectCosts.get(projectId)?.totalCost || 0;
  }
}
