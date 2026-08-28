import { describe, it, expect } from 'vitest';
import { CollaborationStreamService } from '../src/features/collaboration/services/collaboration-stream.service';
import { OrganizationalIntelligenceService } from '../src/packages/agents/memory/organizational-intelligence.service';
import { SelfReflectiveEngine } from '../src/core/execution-engine/self-reflective.engine';
import { ExecutiveDashboardService } from '../src/features/analytics/services/executive-dashboard.service';

describe('AI Teams Platform — Phases 21-25 Integration Verification', () => {
  it('Phase 21: should generate real-time agent collaboration chat feed with developer metadata', async () => {
    const feed = await CollaborationStreamService.getLiveCollaborationFeed('test-project-1');
    expect(feed.length).toBeGreaterThan(0);

    const firstMsg = feed[0]!;
    expect(firstMsg.agentRole).toBeDefined();
    expect(firstMsg.avatarUrl).toBeDefined();
    expect(firstMsg.devMetadata).toBeDefined();
    expect(firstMsg.devMetadata?.tokenUsage).toBeGreaterThan(0);
  });

  it('Phase 23: should prefetch and rank organizational intelligence memory before task execution', async () => {
    const memories = await OrganizationalIntelligenceService.prefetchOrganizationalContext(
      'ARCHITECT',
      'Design modular Next.js REST API with Prisma ORM'
    );
    expect(memories.length).toBeGreaterThan(0);
    expect(memories[0]!.relevanceScore).toBeGreaterThan(0.5);

    const analytics = await OrganizationalIntelligenceService.getMemoryAnalytics();
    expect(analytics.totalLearnings).toBeGreaterThan(0);
    expect(analytics.memoryEfficiencyScore).toBeGreaterThan(80);
  });

  it('Phase 24: should execute self-reflective self-healing review before passing artifacts to QA', async () => {
    const sampleCode = {
      'src/api.ts': 'export const api = z.object({ id: z.string() });',
    };

    const report = await SelfReflectiveEngine.executeSelfReflection('proj-1', 'DEVELOPER', sampleCode);
    expect(report.checklist.length).toBe(7);
    expect(report.scores.overallScore).toBeGreaterThan(70);
    expect(report.scores.securityScore).toBeGreaterThan(80);
  });

  it('Phase 25: should generate executive business and engineering report for CEO AI', async () => {
    const report = await ExecutiveDashboardService.generateExecutiveReport('proj-1');
    expect(report.projectSummary.totalActiveProjects).toBeGreaterThan(0);
    expect(report.engineeringMetrics.velocityScore).toBeGreaterThan(80);
    expect(report.businessMetrics.deploymentSuccessRatePercent).toBeGreaterThan(90);
    expect(report.executiveSummary).toContain('AI Autonomous Software Company');
    expect(report.topWins.length).toBeGreaterThan(0);
    expect(report.topRisks.length).toBeGreaterThan(0);
  });
});
