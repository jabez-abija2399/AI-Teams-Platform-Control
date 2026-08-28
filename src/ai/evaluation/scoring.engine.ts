import type { AgentRole } from '@/packages/agents/core/agent.types';
import type { AgentQualityScore, EvaluationMetricRecord, AgentAnalyticsSummary } from './evaluation.types';

export class ScoringEngine {
  private metrics: EvaluationMetricRecord[] = [];

  public calculateScore(role: AgentRole, output: unknown, violations: string[] = []): AgentQualityScore {
    let baseScore = 90;
    if (violations.length > 0) {
      baseScore -= violations.length * 15;
    }

    const outStr = typeof output === 'string' ? output : JSON.stringify(output || {});
    const lower = outStr.toLowerCase();

    // Check requirement understanding
    let reqScore = baseScore;
    if (lower.includes('vision') || lower.includes('requirements') || lower.includes('user stories') || lower.includes('problem')) {
      reqScore = Math.min(100, reqScore + 5);
    }

    // Check architecture quality
    let archScore = baseScore;
    if (lower.includes('architecture') || lower.includes('schema') || lower.includes('api') || lower.includes('database')) {
      archScore = Math.min(100, archScore + 5);
    }

    // Check code quality
    let codeScore = baseScore;
    if (lower.includes('```typescript') || lower.includes('interface') || lower.includes('zod') || lower.includes('export')) {
      codeScore = Math.min(100, codeScore + 5);
    } if (lower.includes('any')) {
      codeScore = Math.max(0, codeScore - 10);
    }

    // Check security awareness
    let secScore = baseScore;
    if (lower.includes('auth') || lower.includes('validation') || lower.includes('zod') || lower.includes('security') || lower.includes('encrypt') || lower.includes('rbac')) {
      secScore = Math.min(100, secScore + 5);
    } if (lower.includes('without validation') || lower.includes('password =') || lower.includes('hardcoded')) {
      secScore = Math.max(0, secScore - 25);
    }

    // Check testing quality
    let testScore = baseScore;
    if (lower.includes('test') || lower.includes('acceptance criteria') || lower.includes('expect') || lower.includes('qa') || lower.includes('spec')) {
      testScore = Math.min(100, testScore + 5);
    }

    // Check communication quality
    const commScore = Math.max(0, Math.min(100, baseScore));

    const overall = Math.round((archScore + reqScore + codeScore + secScore + testScore + commScore) / 6);

    return {
      architectureQuality: Math.max(0, Math.min(100, archScore)),
      requirementUnderstanding: Math.max(0, Math.min(100, reqScore)),
      codeQuality: Math.max(0, Math.min(100, codeScore)),
      securityAwareness: Math.max(0, Math.min(100, secScore)),
      testingQuality: Math.max(0, Math.min(100, testScore)),
      communicationQuality: commScore,
      overallScore: Math.max(0, Math.min(100, overall)),
    };
  }

  public recordMetric(metric: EvaluationMetricRecord): void {
    this.metrics.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    });
  }

  public getMetrics(projectId?: string): EvaluationMetricRecord[] {
    if (projectId) {
      return this.metrics.filter((m) => m.projectId === projectId);
    }
    return this.metrics;
  }

  public getAgentAnalyticsSummary(agentId: AgentRole): AgentAnalyticsSummary {
    const agentMetrics = this.metrics.filter((m) => m.agentId === agentId);
    const completed = agentMetrics.filter((m) => m.success);
    const failed = agentMetrics.filter((m) => !m.success);

    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((sum, m) => sum + (m.qualityScore?.overallScore ?? 0), 0) / completed.length)
      : 0;

    const avgTime = agentMetrics.length > 0
      ? Math.round(agentMetrics.reduce((sum, m) => sum + m.executionTimeMs, 0) / agentMetrics.length)
      : 0;

    const totalRetries = agentMetrics.reduce((sum, m) => sum + m.retryCount, 0);

    const mistakeCounts = new Map<string, number>();
    for (const f of failed) {
      if (f.failureReason) {
        mistakeCounts.set(f.failureReason, (mistakeCounts.get(f.failureReason) || 0) + 1);
      }
    }

    const commonMistakes = Array.from(mistakeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason]) => reason);

    return {
      agentId,
      tasksCompleted: completed.length,
      averageQualityScore: avgScore,
      failureCount: failed.length,
      retryCount: totalRetries,
      averageExecutionTimeMs: avgTime,
      commonMistakes,
    };
  }
}

let scoringEngineInstance: ScoringEngine | null = null;
export function getScoringEngine(): ScoringEngine {
  if (!scoringEngineInstance) {
    scoringEngineInstance = new ScoringEngine();
  }
  return scoringEngineInstance;
}
