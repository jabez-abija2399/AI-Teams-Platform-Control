export type {
  PlatformEventInfo,
  MetricInfo,
  ProjectHealthInfo,
  AnalyticsDashboard,
  MetricTimeSeries,
} from './types';

export {
  recordEventSchema,
  eventFilterSchema,
  recordMetricSchema,
} from './schemas/analytics.schema';

export type {
  RecordEventInput,
  EventFilter,
  RecordMetricInput,
} from './schemas/analytics.schema';

export {
  recordEvent,
  listEvents,
  getEventsByType,
  getEventCountsByType,
} from './services/event.service';

export {
  recordMetric,
  getMetrics,
  getMetricTimeSeries,
  getMetricsByCategory,
} from './services/metric.service';

export {
  calculateProjectHealth,
  getProjectHealth,
  updateProjectHealth,
} from './services/health.service';

export { getAnalyticsDashboard } from './services/dashboard.service';

export { useEvents, useRecordEvent, useEventsByType, useEventCountsByType } from './hooks/use-events';
export { useMetrics, useRecordMetric, useMetricTimeSeries, useMetricsByCategory } from './hooks/use-metrics';
export { useProjectHealth, useCalculateHealth } from './hooks/use-project-health';
export { useDashboard } from './hooks/use-dashboard';

export { EventTimeline } from './components/event-timeline';
export { MetricChart } from './components/metric-chart';
export { HealthScore } from './components/health-score';
export { ProjectDashboard } from './components/project-dashboard';
export { AnalyticsPanel } from './components/analytics-panel';
