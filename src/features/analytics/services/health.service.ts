import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { ProjectHealthInfo } from '@/features/analytics/types';

function toProjectHealthInfo(
  health: {
    id: string;
    projectId: string;
    score: number;
    status: string;
    recommendations: string[];
    updatedAt: Date;
  },
): ProjectHealthInfo {
  return {
    id: health.id,
    projectId: health.projectId,
    score: health.score,
    status: health.status,
    recommendations: health.recommendations,
    updatedAt: health.updatedAt,
  };
}

function getStatus(score: number): string {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'warning';
  return 'critical';
}

function generateRecommendations(areas: {
  coverageScore: number;
  testPassScore: number;
  bugScore: number;
  reviewScore: number;
}): string[] {
  const recs: string[] = [];

  if (areas.coverageScore < 70) {
    recs.push('Increase test coverage — current coverage is below target.');
  }
  if (areas.testPassScore < 70) {
    recs.push('Improve test pass rate — focus on fixing failing tests.');
  }
  if (areas.bugScore < 70) {
    recs.push('Address open bugs — consider triaging and resolving critical issues.');
  }
  if (areas.reviewScore < 70) {
    recs.push('Enhance code review practices — review scores are below target.');
  }

  if (recs.length === 0) {
    recs.push('Project health looks good — keep up the great work!');
  }

  return recs;
}

export async function calculateProjectHealth(
  projectId: string,
): Promise<ApiResult<ProjectHealthInfo>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };
  }

  const [testCases, bugReports, latestCoverage, codeReviews] = await Promise.all([
    prisma.testCase.findMany({
      where: { projectId },
      select: { status: true },
    }),
    prisma.bugReport.findMany({
      where: { projectId },
      select: { severity: true, status: true },
    }),
    prisma.coverageReport.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { percentage: true },
    }),
    prisma.codeReview.findMany({
      select: { score: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalTests = testCases.length;
  const passedTests = testCases.filter((t) => t.status === 'PASSED').length;
  const testPassRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 100;

  const coverage = latestCoverage?.percentage ?? 0;

  const openBugs = bugReports.filter(
    (b) => b.status !== 'RESOLVED' && b.status !== 'CLOSED',
  ).length;
  const criticalBugs = bugReports.filter(
    (b) =>
      b.severity === 'CRITICAL' &&
      b.status !== 'RESOLVED' &&
      b.status !== 'CLOSED',
  ).length;

  const bugScore =
    openBugs === 0
      ? 100
      : Math.max(0, 100 - openBugs * 5 - criticalBugs * 15);

  const avgReviewScore =
    codeReviews.length > 0
      ? codeReviews.reduce((sum, r) => sum + r.score, 0) / codeReviews.length
      : 80;

  const coverageScore = Math.min(coverage, 100);
  const testPassScore = testPassRate;

  const areas = {
    coverageScore,
    testPassScore,
    bugScore: Math.max(bugScore, 0),
    reviewScore: avgReviewScore,
  };

  const score = Math.round(
    coverageScore * 0.3 +
      testPassScore * 0.3 +
      Math.max(bugScore, 0) * 0.2 +
      avgReviewScore * 0.2,
  );

  const clampedScore = Math.max(0, Math.min(100, score));
  const status = getStatus(clampedScore);
  const recommendations = generateRecommendations(areas);

  const health = await prisma.projectHealth.upsert({
    where: { projectId },
    create: {
      projectId,
      score: clampedScore,
      status,
      recommendations,
    },
    update: {
      score: clampedScore,
      status,
      recommendations,
    },
  });

  return { success: true, data: toProjectHealthInfo(health) };
}

export async function getProjectHealth(
  projectId: string,
): Promise<ApiResult<ProjectHealthInfo | null>> {
  const health = await prisma.projectHealth.findFirst({
    where: { projectId },
  });

  if (!health) {
    return { success: true, data: null };
  }

  return { success: true, data: toProjectHealthInfo(health) };
}

export async function updateProjectHealth(
  projectId: string,
): Promise<ApiResult<ProjectHealthInfo>> {
  return calculateProjectHealth(projectId);
}
