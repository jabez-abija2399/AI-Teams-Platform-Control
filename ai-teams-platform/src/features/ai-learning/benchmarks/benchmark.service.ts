import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';

interface BenchmarkTask {
  task: string;
  expectedScore: number;
}

interface BenchmarkResult {
  id: string;
  agentId: string;
  task: string;
  score: number;
  result: Record<string, unknown> | null;
}

const BENCHMARK_TASKS: Record<string, BenchmarkTask[]> = {
  CODE_GENERATION: [
    { task: 'Generate a basic CRUD API endpoint', expectedScore: 80 },
    { task: 'Write unit tests for a utility function', expectedScore: 75 },
    { task: 'Implement error handling middleware', expectedScore: 85 },
  ],
  CODE_REVIEW: [
    { task: 'Review a function for security vulnerabilities', expectedScore: 70 },
    { task: 'Identify performance bottlenecks in code', expectedScore: 65 },
    { task: 'Check code style consistency', expectedScore: 90 },
  ],
  DOCUMENTATION: [
    { task: 'Write API documentation for a REST endpoint', expectedScore: 75 },
    { task: 'Generate a README for a project', expectedScore: 80 },
  ],
  DEBUGGING: [
    { task: 'Identify the root cause of a failing test', expectedScore: 70 },
    { task: 'Trace an error through a call stack', expectedScore: 65 },
    { task: 'Fix a race condition in async code', expectedScore: 60 },
  ],
};

export async function runBenchmark(
  agentId: string,
  category: string,
): Promise<ApiResult<BenchmarkResult[]>> {
  const tasks = BENCHMARK_TASKS[category];
  if (!tasks) {
    return {
      success: false,
      error: {
        message: `Unknown benchmark category: ${category}. Available: ${Object.keys(BENCHMARK_TASKS).join(', ')}`,
        code: 'VALIDATION_ERROR',
      },
    };
  }

  const results: BenchmarkResult[] = [];

  for (const benchmarkTask of tasks) {
    const baseScore = 50 + Math.random() * 40;
    const score = Math.round(Math.min(100, Math.max(0, baseScore)) * 100) / 100;

    const record = await prisma.benchmark.create({
      data: {
        agentId,
        task: benchmarkTask.task,
        score,
        result: {
          category,
          expectedScore: benchmarkTask.expectedScore,
          meetsExpectation: score >= benchmarkTask.expectedScore,
          executedAt: new Date().toISOString(),
        },
      },
    });

    results.push({
      id: record.id,
      agentId: record.agentId,
      task: record.task,
      score: record.score,
      result: record.result as Record<string, unknown>,
    });
  }

  return { success: true, data: results };
}
