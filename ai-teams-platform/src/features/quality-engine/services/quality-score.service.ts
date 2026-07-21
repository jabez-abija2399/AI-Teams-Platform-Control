import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { CodeReviewInfo, QualityMetrics } from '@/features/quality-engine/types';
import { submitCodeReviewSchema, type SubmitCodeReviewInput } from '@/features/quality-engine/schemas/quality.schema';
import type { CodeReviewIssue } from '@/features/quality-engine/types';

function toCodeReviewInfo(
  review: {
    id: string;
    commitId: string;
    score: number;
    issues: unknown;
    summary: string | null;
    createdAt: Date;
  },
): CodeReviewInfo {
  const issues = Array.isArray(review.issues) ? (review.issues as CodeReviewIssue[]) : [];
  return {
    id: review.id,
    commitId: review.commitId,
    score: review.score,
    issues,
    summary: review.summary ?? '',
    reviewedAt: review.createdAt,
  };
}

export async function submitCodeReview(
  commitId: string,
  score: number,
  issues: CodeReviewIssue[],
  summary?: string,
): Promise<ApiResult<CodeReviewInfo>> {
  const input: SubmitCodeReviewInput = { commitId, score, issues, summary };
  const parsed = submitCodeReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid code review data',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const existing = await prisma.codeReview.findFirst({ where: { commitId: parsed.data.commitId } });

  let review;
  if (existing) {
    review = await prisma.codeReview.update({
      where: { id: existing.id },
      data: {
        score: parsed.data.score,
        issues: JSON.parse(JSON.stringify(parsed.data.issues)),
        summary: parsed.data.summary,
      },
    });
  } else {
    review = await prisma.codeReview.create({
      data: {
        commitId: parsed.data.commitId,
        score: parsed.data.score,
        issues: JSON.parse(JSON.stringify(parsed.data.issues)),
        summary: parsed.data.summary,
      },
    });
  }

  return { success: true, data: toCodeReviewInfo(review) };
}

export async function getCodeReview(
  commitId: string,
): Promise<ApiResult<CodeReviewInfo | null>> {
  const review = await prisma.codeReview.findFirst({ where: { commitId } });
  if (!review) {
    return { success: true, data: null };
  }
  return { success: true, data: toCodeReviewInfo(review) };
}

export async function getQualityMetrics(
  projectId: string,
): Promise<ApiResult<QualityMetrics>> {
  const [testCases, bugReports, latestCoverage, executions] = await Promise.all([
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
    prisma.testExecution.findMany({
      where: { test: { projectId } },
      select: { duration: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  const totalTests = testCases.length;
  const passingTests = testCases.filter((t) => t.status === 'PASSED').length;
  const failingTests = testCases.filter((t) => t.status === 'FAILED').length;
  const skippedTests = testCases.filter((t) => t.status === 'SKIPPED').length;

  const openBugs = bugReports.filter((b) => b.status === 'OPEN').length;
  const criticalBugs = bugReports.filter(
    (b) => b.severity === 'CRITICAL' && b.status !== 'RESOLVED' && b.status !== 'CLOSED',
  ).length;

  const avgTestDuration =
    executions.length > 0
      ? Math.round(executions.reduce((sum, e) => sum + e.duration, 0) / executions.length)
      : 0;

  return {
    success: true,
    data: {
      totalTests,
      passingTests,
      failingTests,
      skippedTests,
      coverage: latestCoverage?.percentage ?? 0,
      openBugs,
      criticalBugs,
      avgTestDuration,
    },
  };
}
