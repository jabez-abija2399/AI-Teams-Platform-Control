'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestList } from '@/features/quality-engine/components/test-list';
import { BugReportList } from '@/features/quality-engine/components/bug-report-list';
import { CoverageChart } from '@/features/quality-engine/components/coverage-chart';
import { QualityDashboard } from '@/features/quality-engine/components/quality-dashboard';
import { Shield, FlaskConical, Bug, BarChart3 } from 'lucide-react';

export function QualityPanel({ projectId }: { projectId: string }) {
  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="dashboard" className="flex flex-col h-full">
        <TabsList variant="line" className="w-full justify-start px-4">
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="tests">
            <FlaskConical className="h-4 w-4" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="bugs">
            <Bug className="h-4 w-4" />
            Bugs
          </TabsTrigger>
          <TabsTrigger value="coverage">
            <Shield className="h-4 w-4" />
            Coverage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="flex-1 overflow-auto p-4">
          <QualityDashboard projectId={projectId} />
        </TabsContent>

        <TabsContent value="tests" className="flex-1 overflow-auto p-4">
          <TestList projectId={projectId} />
        </TabsContent>

        <TabsContent value="bugs" className="flex-1 overflow-auto p-4">
          <BugReportList projectId={projectId} />
        </TabsContent>

        <TabsContent value="coverage" className="flex-1 overflow-auto p-4">
          <CoverageChart projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
