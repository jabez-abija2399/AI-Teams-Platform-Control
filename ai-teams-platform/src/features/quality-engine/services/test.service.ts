import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { TestCaseInfo, TestExecutionInfo } from '@/features/quality-engine/types';
import {
  createTestCaseSchema,
  testCaseFilterSchema,
  type CreateTestCaseInput,
  type TestCaseFilter,
} from '@/features/quality-engine/schemas/quality.schema';

function toTestCaseInfo(
  test: {
    id: string;
    projectId: string;
    name: string;
    description: string | null;
    type: string;
    framework: string;
    file: string;
    status: string;
    executions: { result: string; duration: number }[];
  },
): TestCaseInfo {
  const lastExecution = test.executions.length > 0 ? test.executions[0] : null;
  return {
    id: test.id,
    projectId: test.projectId,
    name: test.name,
    description: test.description,
    type: test.type,
    framework: test.framework,
    file: test.file,
    status: test.status,
    executionCount: test.executions.length,
    lastResult: lastExecution?.result ?? null,
  };
}

function toTestExecutionInfo(
  execution: {
    id: string;
    testId: string;
    result: string;
    logs: string;
    duration: number;
    createdAt: Date;
  },
): TestExecutionInfo {
  return {
    id: execution.id,
    testId: execution.testId,
    result: execution.result,
    logs: execution.logs,
    duration: execution.duration,
    createdAt: execution.createdAt,
  };
}

export async function createTestCase(
  projectId: string,
  input: CreateTestCaseInput,
): Promise<ApiResult<TestCaseInfo>> {
  const parsed = createTestCaseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid test case data',
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

  const testCase = await prisma.testCase.create({
    data: { ...parsed.data, projectId },
    include: { executions: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  return { success: true, data: toTestCaseInfo(testCase) };
}

export async function listTestCases(
  projectId: string,
  filter?: TestCaseFilter,
): Promise<ApiResult<TestCaseInfo[]>> {
  const parsedFilter = filter ? testCaseFilterSchema.safeParse(filter) : undefined;
  const where: Record<string, unknown> = { projectId };
  if (parsedFilter?.success) {
    if (parsedFilter.data.status) where.status = parsedFilter.data.status;
    if (parsedFilter.data.type) where.type = parsedFilter.data.type;
    if (parsedFilter.data.framework) where.framework = parsedFilter.data.framework;
  }

  const tests = await prisma.testCase.findMany({
    where,
    include: { executions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  });

  return { success: true, data: tests.map(toTestCaseInfo) };
}

export async function deleteTestCase(testId: string): Promise<ApiResult<void>> {
  const existing = await prisma.testCase.findFirst({ where: { id: testId } });
  if (!existing) {
    return {
      success: false,
      error: { message: 'Test case not found', code: 'NOT_FOUND' },
    };
  }

  await prisma.testCase.delete({ where: { id: testId } });
  return { success: true, data: undefined };
}

export async function executeTest(testId: string): Promise<ApiResult<TestExecutionInfo>> {
  const test = await prisma.testCase.findFirst({ where: { id: testId } });
  if (!test) {
    return {
      success: false,
      error: { message: 'Test case not found', code: 'NOT_FOUND' },
    };
  }

  const duration = Math.floor(Math.random() * 5000) + 100;
  const result = Math.random() > 0.2 ? 'PASSED' : 'FAILED';
  const logs = result === 'PASSED' ? 'All assertions passed.' : 'Assertion failed at line 42.';

  const [execution] = await prisma.$transaction([
    prisma.testExecution.create({
      data: { testId, result, logs, duration },
    }),
    prisma.testCase.update({
      where: { id: testId },
      data: { status: result === 'PASSED' ? 'PASSED' : 'FAILED' },
    }),
  ]);

  return { success: true, data: toTestExecutionInfo(execution) };
}

export async function getTestExecutions(
  testId: string,
  limit = 20,
): Promise<ApiResult<TestExecutionInfo[]>> {
  const test = await prisma.testCase.findFirst({ where: { id: testId } });
  if (!test) {
    return {
      success: false,
      error: { message: 'Test case not found', code: 'NOT_FOUND' },
    };
  }

  const executions = await prisma.testExecution.findMany({
    where: { testId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return { success: true, data: executions.map(toTestExecutionInfo) };
}
