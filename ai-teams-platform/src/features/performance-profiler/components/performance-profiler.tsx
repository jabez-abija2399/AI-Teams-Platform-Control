'use client';

import { useState } from 'react';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Package,
  Zap,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfiler } from '../hooks/use-profiler';
import type { PerformanceReport } from '../types';

interface PerformanceProfilerProps {
  projectId: string;
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color =
    score >= 90 ? 'text-green-500' : score >= 70 ? 'text-amber-500' : 'text-red-500';
  const bg =
    score >= 90
      ? 'stroke-green-500'
      : score >= 70
        ? 'stroke-amber-500'
        : 'stroke-red-500';
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
          <circle cx="22" cy="22" r="18" fill="none" strokeWidth="3" className={bg} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${color}`}>
          {score}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

export function PerformanceProfiler({ projectId }: PerformanceProfilerProps) {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const profiler = useProfiler();

  async function runAnalysis() {
    const result = await profiler.mutateAsync({ projectId });
    if (result.success) {
      setReport(result.data);
    }
  }

  if (profiler.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Analyzing project performance...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <Activity className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">Performance Profiler</p>
        <p className="text-xs text-muted-foreground text-center max-w-[250px]">
          Analyze bundle size, code quality, accessibility, and get optimization recommendations
        </p>
        <Button size="sm" onClick={runAnalysis}>
          <Zap className="h-3.5 w-3.5 mr-2" />
          Run Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Performance Report</p>
        <Button size="sm" variant="outline" onClick={runAnalysis}>
          <Zap className="h-3.5 w-3.5 mr-1" />
          Re-analyze
        </Button>
      </div>

      <div className="flex items-center justify-around py-3 border rounded-lg">
        <ScoreRing score={report.score.overall} label="Overall" />
        <ScoreRing score={report.score.performance} label="Perf" />
        <ScoreRing score={report.score.accessibility} label="A11y" />
        <ScoreRing score={report.score.bestPractices} label="BP" />
        <ScoreRing score={report.score.seo} label="SEO" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="border rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground mb-1">JS Bundle</p>
          <p className="text-sm font-bold">{(report.bundle.jsSize / 1024).toFixed(1)} KB</p>
        </div>
        <div className="border rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground mb-1">CSS</p>
          <p className="text-sm font-bold">{(report.bundle.cssSize / 1024).toFixed(1)} KB</p>
        </div>
        <div className="border rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground mb-1">Total</p>
          <p className="text-sm font-bold">{(report.bundle.totalSize / 1024).toFixed(1)} KB</p>
        </div>
        <div className="border rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground mb-1">Packages</p>
          <p className="text-sm font-bold">{report.bundle.packages.length}</p>
        </div>
      </div>

      {report.issues.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium">Issues ({report.issues.length})</p>
          {report.issues.map((issue) => (
            <div
              key={issue.id}
              className={`border rounded-lg p-2 text-xs ${
                issue.severity === 'critical'
                  ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                  : issue.severity === 'warning'
                    ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950'
                    : 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-medium">{issue.title}</span>
                <span className="ml-auto text-[10px] uppercase font-bold">{issue.severity}</span>
              </div>
              <p className="text-muted-foreground">{issue.description}</p>
              <p className="text-muted-foreground mt-1">
                <strong>Recommendation:</strong> {issue.recommendation}
              </p>
            </div>
          ))}
        </div>
      )}

      {report.recommendations.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium">Recommendations</p>
          {report.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground border rounded-lg p-2">
              <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      )}

      {report.bundle.packages.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium">Top Packages</p>
          {report.bundle.packages
            .sort((a, b) => b.size - a.size)
            .slice(0, 10)
            .map((pkg) => (
              <div key={pkg.name} className="flex items-center justify-between text-xs border rounded-lg px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{pkg.name}</span>
                  <span className="text-muted-foreground">v{pkg.version}</span>
                </div>
                <span className="text-muted-foreground">{(pkg.gzipSize / 1024).toFixed(1)} KB gzip</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
