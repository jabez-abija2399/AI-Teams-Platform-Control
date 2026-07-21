'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectDashboard } from '@/features/analytics/components/project-dashboard';
import { EventTimeline } from '@/features/analytics/components/event-timeline';
import { HealthScore } from '@/features/analytics/components/health-score';
import { MetricChart } from '@/features/analytics/components/metric-chart';
import { BarChart3, Activity, Heart, TrendingUp } from 'lucide-react';

export function AnalyticsPanel({ projectId }: { projectId: string }) {
  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="dashboard" className="flex flex-col h-full">
        <TabsList variant="line" className="w-full justify-start px-4">
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="events">
            <Activity className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="health">
            <Heart className="h-4 w-4" />
            Health
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <TrendingUp className="h-4 w-4" />
            Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="flex-1 overflow-auto p-4">
          <ProjectDashboard projectId={projectId} />
        </TabsContent>

        <TabsContent value="events" className="flex-1 overflow-auto p-4">
          <EventTimeline projectId={projectId} />
        </TabsContent>

        <TabsContent value="health" className="flex-1 overflow-auto p-4">
          <HealthScore projectId={projectId} />
        </TabsContent>

        <TabsContent value="metrics" className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <MetricChart
              projectId={projectId}
              metricName="build_time"
              days={14}
              label="Build Time"
            />
            <MetricChart
              projectId={projectId}
              metricName="response_time"
              days={14}
              label="Response Time"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
