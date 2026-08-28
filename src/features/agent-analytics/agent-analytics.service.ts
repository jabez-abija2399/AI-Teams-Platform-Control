import type { AgentRole } from '@/packages/agents/core/agent.types';
import { AGENT_CONFIGS } from '@/packages/agents/core/agent.constants';
import { getScoringEngine } from '../../ai/evaluation/scoring.engine';
import type { AgentAnalyticsSummary } from '../../ai/evaluation/evaluation.types';

export class AgentAnalyticsService {
  public getAgentSummary(agentId: AgentRole): AgentAnalyticsSummary {
    const scoring = getScoringEngine();
    return scoring.getAgentAnalyticsSummary(agentId);
  }

  public getFullPerformanceDashboard(): Record<string, AgentAnalyticsSummary> {
    const dashboard: Record<string, AgentAnalyticsSummary> = {};
    const roles = Object.keys(AGENT_CONFIGS) as AgentRole[];

    for (const role of roles) {
      dashboard[role] = this.getAgentSummary(role);
    }

    return dashboard;
  }

  public getOverallPlatformSuccessRate(): { totalTasks: number; successRate: number; averageQuality: number } {
    const scoring = getScoringEngine();
    const allMetrics = scoring.getMetrics();
    if (allMetrics.length === 0) {
      return { totalTasks: 0, successRate: 100, averageQuality: 100 };
    }

    const completed = allMetrics.filter((m) => m.success);
    const totalScore = completed.reduce((sum, m) => sum + (m.qualityScore?.overallScore ?? 0), 0);
    const avgQuality = completed.length > 0 ? Math.round(totalScore / completed.length) : 0;
    const successRate = Math.round((completed.length / allMetrics.length) * 100);

    return {
      totalTasks: allMetrics.length,
      successRate,
      averageQuality: avgQuality,
    };
  }
}

let analyticsServiceInstance: AgentAnalyticsService | null = null;
export function getAgentAnalyticsService(): AgentAnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AgentAnalyticsService();
  }
  return analyticsServiceInstance;
}
