import type { TokenUsageSummary } from './runtime.types';

const projectTokenUsage = new Map<string, TokenUsageSummary>();

export class TokenTrackerService {
  /**
   * Records token usage from an execution
   */
  public static recordUsage(
    projectId: string,
    inputTokens: number,
    outputTokens: number
  ): void {
    const existing = projectTokenUsage.get(projectId) || {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      executionCount: 0,
    };

    existing.totalInputTokens += inputTokens;
    existing.totalOutputTokens += outputTokens;
    existing.totalTokens += inputTokens + outputTokens;
    existing.executionCount += 1;
    projectTokenUsage.set(projectId, existing);
  }

  /**
   * Gets token usage summary for a project
   */
  public static getUsage(projectId: string): TokenUsageSummary {
    return projectTokenUsage.get(projectId) || {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      executionCount: 0,
    };
  }
}
