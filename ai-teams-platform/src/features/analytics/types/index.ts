export interface PlatformEventInfo {
  id: string;
  projectId: string;
  type: string;
  source: string;
  data: Record<string, unknown> | null;
  createdAt: Date;
}

export interface MetricInfo {
  id: string;
  projectId: string;
  name: string;
  value: number;
  category: string;
  createdAt: Date;
}

export interface ProjectHealthInfo {
  id: string;
  projectId: string;
  score: number;
  status: string;
  recommendations: string[];
  updatedAt: Date;
}

export interface AnalyticsDashboard {
  totalEvents: number;
  eventsByType: Record<string, number>;
  metricsByCategory: Record<string, MetricInfo[]>;
  health: ProjectHealthInfo | null;
  recentEvents: PlatformEventInfo[];
  timeline: { date: string; count: number }[];
}

export interface MetricTimeSeries {
  name: string;
  data: { date: string; value: number }[];
}
