import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { MetricInfo, MetricTimeSeries } from '@/features/analytics/types';
import {
  recordMetricSchema,
  type RecordMetricInput,
} from '@/features/analytics/schemas/analytics.schema';

function toMetricInfo(
  metric: {
    id: string;
    projectId: string;
    name: string;
    value: number;
    category: string;
    createdAt: Date;
  },
): MetricInfo {
  return {
    id: metric.id,
    projectId: metric.projectId,
    name: metric.name,
    value: metric.value,
    category: metric.category,
    createdAt: metric.createdAt,
  };
}

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

export async function recordMetric(
  projectId: string,
  input: RecordMetricInput,
): Promise<ApiResult<MetricInfo>> {
  const parsed = recordMetricSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid metric data',
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

  const metric = await prisma.metric.create({
    data: {
      projectId,
      name: parsed.data.name,
      value: parsed.data.value,
      category: parsed.data.category,
    },
  });

  return { success: true, data: toMetricInfo(metric) };
}

export async function getMetrics(
  projectId: string,
  category?: string,
  since?: string,
): Promise<ApiResult<MetricInfo[]>> {
  const where: Record<string, unknown> = { projectId };
  if (category) where.category = category;
  if (since) {
    where.createdAt = { gte: new Date(since) };
  }

  const metrics = await prisma.metric.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return { success: true, data: metrics.map(toMetricInfo) };
}

export async function getMetricTimeSeries(
  projectId: string,
  name: string,
  days = 30,
): Promise<ApiResult<MetricTimeSeries>> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const metrics = await prisma.metric.findMany({
    where: {
      projectId,
      name,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'asc' },
  });

  const groupedByDay = new Map<string, number[]>();
  for (const metric of metrics) {
    const day = toDateKey(metric.createdAt);
    const values = groupedByDay.get(day) ?? [];
    values.push(metric.value);
    groupedByDay.set(day, values);
  }

  const data: { date: string; value: number }[] = [];
  const currentDate = new Date(since);
  const today = new Date();

  while (currentDate <= today) {
    const dayKey = toDateKey(currentDate);
    const values = groupedByDay.get(dayKey);
    const avg =
      values && values.length > 0
        ? values.reduce((sum, v) => sum + v, 0) / values.length
        : 0;
    data.push({ date: dayKey, value: Math.round(avg * 100) / 100 });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { success: true, data: { name, data } };
}

export async function getMetricsByCategory(
  projectId: string,
): Promise<ApiResult<Record<string, MetricInfo[]>>> {
  const metrics = await prisma.metric.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const byCategory: Record<string, MetricInfo[]> = {};
  for (const metric of metrics) {
    const cat = metric.category;
    if (!byCategory[cat]) {
      byCategory[cat] = [];
    }
    byCategory[cat]!.push(toMetricInfo(metric));
  }

  return { success: true, data: byCategory };
}
