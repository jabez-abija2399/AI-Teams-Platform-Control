import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { BugReportInfo } from '@/features/quality-engine/types';
import {
  createBugReportSchema,
  bugReportFilterSchema,
  updateBugStatusSchema,
  type CreateBugReportInput,
  type BugReportFilter,
  type UpdateBugStatusInput,
} from '@/features/quality-engine/schemas/quality.schema';

function toBugReportInfo(
  bug: {
    id: string;
    projectId: string;
    severity: string;
    title: string;
    description: string;
    file: string | null;
    line: number | null;
    solution: string | null;
    status: string;
    createdAt: Date;
  },
): BugReportInfo {
  return {
    id: bug.id,
    projectId: bug.projectId,
    severity: bug.severity,
    title: bug.title,
    description: bug.description,
    file: bug.file,
    line: bug.line,
    solution: bug.solution,
    status: bug.status,
    createdAt: bug.createdAt,
  };
}

export async function createBugReport(
  projectId: string,
  input: CreateBugReportInput,
): Promise<ApiResult<BugReportInfo>> {
  const parsed = createBugReportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid bug report data',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };
  }

  const bug = await prisma.bugReport.create({
    data: { ...parsed.data, projectId },
  });

  return { success: true, data: toBugReportInfo(bug) };
}

export async function listBugReports(
  projectId: string,
  filter?: BugReportFilter,
): Promise<ApiResult<BugReportInfo[]>> {
  const parsedFilter = filter ? bugReportFilterSchema.safeParse(filter) : undefined;
  const where: Record<string, unknown> = { projectId };
  if (parsedFilter?.success) {
    if (parsedFilter.data.severity) where.severity = parsedFilter.data.severity;
    if (parsedFilter.data.status) where.status = parsedFilter.data.status;
  }

  const bugs = await prisma.bugReport.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return { success: true, data: bugs.map(toBugReportInfo) };
}

export async function updateBugStatus(
  bugId: string,
  status: string,
  solution?: string,
): Promise<ApiResult<BugReportInfo>> {
  const input: UpdateBugStatusInput = { status: status as UpdateBugStatusInput['status'], solution };
  const parsed = updateBugStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid status data',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const existing = await prisma.bugReport.findFirst({ where: { id: bugId } });
  if (!existing) {
    return {
      success: false,
      error: { message: 'Bug report not found', code: 'NOT_FOUND' },
    };
  }

  const bug = await prisma.bugReport.update({
    where: { id: bugId },
    data: {
      status: parsed.data.status,
      ...(parsed.data.solution !== undefined && { solution: parsed.data.solution }),
    },
  });

  return { success: true, data: toBugReportInfo(bug) };
}

export async function deleteBugReport(bugId: string): Promise<ApiResult<void>> {
  const existing = await prisma.bugReport.findFirst({ where: { id: bugId } });
  if (!existing) {
    return {
      success: false,
      error: { message: 'Bug report not found', code: 'NOT_FOUND' },
    };
  }

  await prisma.bugReport.delete({ where: { id: bugId } });
  return { success: true, data: undefined };
}
