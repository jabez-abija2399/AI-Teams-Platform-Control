import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type {
  AnalyticsDashboard,
  PlatformEventInfo,
  MetricInfo,
  ProjectHealthInfo,
} from '@/features/analytics/types';

function toPlatformEventInfo(
  event: {
    id: string;
    projectId: string;
    type: string;
    source: string;
    data: unknown;
    createdAt: Date;
  },
): PlatformEventInfo {
  return {
    id: event.id,
    projectId: event.projectId,
    type: event.type,
    source: event.source,
    data: (event.data as Record<string, unknown>) ?? null,
    createdAt: event.createdAt,
  };
}

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

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

export async function getAnalyticsDashboard(
  projectId: string,
): Promise<ApiResult<AnalyticsDashboard>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [events, metrics, health] = await Promise.all([
    prisma.platformEvent.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.metric.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.projectHealth.findFirst({ where: { projectId } }),
  ]);

  const eventsByType: Record<string, number> = {};
  for (const event of events) {
    eventsByType[event.type] = (eventsByType[event.type] ?? 0) + 1;
  }

  const timelineMap = new Map<string, number>();
  for (const event of events) {
    if (event.createdAt >= thirtyDaysAgo) {
      const day = toDateKey(event.createdAt);
      timelineMap.set(day, (timelineMap.get(day) ?? 0) + 1);
    }
  }

  const timeline: { date: string; count: number }[] = [];
  const currentDate = new Date(thirtyDaysAgo);
  const today = new Date();
  while (currentDate <= today) {
    const dayKey = toDateKey(currentDate);
    timeline.push({ date: dayKey, count: timelineMap.get(dayKey) ?? 0 });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const metricsByCategory: Record<string, MetricInfo[]> = {};
  for (const metric of metrics) {
    const cat = metric.category;
    if (!metricsByCategory[cat]) {
      metricsByCategory[cat] = [];
    }
    metricsByCategory[cat]!.push(toMetricInfo(metric));
  }

  return {
    success: true,
    data: {
      totalEvents: events.length,
      eventsByType,
      metricsByCategory,
      health: health ? toProjectHealthInfo(health) : null,
      recentEvents: events.slice(0, 20).map(toPlatformEventInfo),
      timeline,
    },
  };
}
