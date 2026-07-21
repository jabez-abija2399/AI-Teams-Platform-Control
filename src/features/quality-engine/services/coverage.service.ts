import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { CoverageReportInfo, CoverageFile } from '@/features/quality-engine/types';

function toCoverageReportInfo(
  report: {
    id: string;
    projectId: string;
    percentage: number;
    files: unknown;
    createdAt: Date;
  },
): CoverageReportInfo {
  const files = Array.isArray(report.files) ? (report.files as CoverageFile[]) : [];
  return {
    id: report.id,
    projectId: report.projectId,
    percentage: report.percentage,
    files,
    createdAt: report.createdAt,
  };
}

export async function generateCoverageReport(
  projectId: string,
  files: CoverageFile[],
): Promise<ApiResult<CoverageReportInfo>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };
  }

  const totalLines = files.reduce((sum, f) => sum + f.total, 0);
  const coveredLines = files.reduce((sum, f) => sum + f.covered, 0);
  const percentage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;

  const report = await prisma.coverageReport.create({
    data: {
      projectId,
      percentage: Math.round(percentage * 100) / 100,
      files: JSON.parse(JSON.stringify(files)),
    },
  });

  return { success: true, data: toCoverageReportInfo(report) };
}

export async function getLatestCoverage(
  projectId: string,
): Promise<ApiResult<CoverageReportInfo | null>> {
  const report = await prisma.coverageReport.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  if (!report) {
    return { success: true, data: null };
  }

  return { success: true, data: toCoverageReportInfo(report) };
}

export async function getCoverageHistory(
  projectId: string,
  limit = 10,
): Promise<ApiResult<CoverageReportInfo[]>> {
  const reports = await prisma.coverageReport.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return { success: true, data: reports.map(toCoverageReportInfo) };
}
