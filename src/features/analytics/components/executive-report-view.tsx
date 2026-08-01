'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExecutiveReport } from '../services/executive-dashboard.service';
import { TrendingUp, ShieldCheck, Zap, AlertTriangle, CheckCircle2, DollarSign, Award, Target } from 'lucide-react';

export function ExecutiveReportView({ projectId }: { projectId?: string }) {
  const [report, setReport] = useState<ExecutiveReport | null>(null);

  useEffect(() => {
    const id = projectId || 'default';
    fetch(`/api/projects/${id}/executive/report`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.report) {
          setReport(data.report);
        }
      })
      .catch(() => null);
  }, [projectId]);

  if (!report) {
    return <div className="p-4 text-xs text-muted-foreground animate-pulse">Generating Executive Summary...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Top Banner Executive Summary */}
      <Card className="border bg-gradient-to-br from-indigo-950/40 via-card to-background shadow-xs">
        <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-400" />
            <CardTitle className="text-base font-bold">Executive AI Business & Engineering Brief</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono text-indigo-400 border-indigo-500/30">
            Automated CEO AI Briefing
          </Badge>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <p className="text-xs text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-lg border">
            {report.executiveSummary}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <div className="bg-card p-3 rounded-lg border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Velocity Score</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-lg font-bold font-mono">{report.engineeringMetrics.velocityScore}%</span>
              </div>
            </div>

            <div className="bg-card p-3 rounded-lg border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Quality Score</span>
              <div className="flex items-center gap-1.5 mt-1">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-lg font-bold font-mono">{report.engineeringMetrics.qualityScore}%</span>
              </div>
            </div>

            <div className="bg-card p-3 rounded-lg border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Sprint Cost</span>
              <div className="flex items-center gap-1.5 mt-1">
                <DollarSign className="h-4 w-4 text-sky-500" />
                <span className="text-lg font-bold font-mono">${report.engineeringMetrics.totalCostUSD}</span>
              </div>
            </div>

            <div className="bg-card p-3 rounded-lg border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Deployment Success</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Target className="h-4 w-4 text-indigo-500" />
                <span className="text-lg font-bold font-mono">{report.businessMetrics.deploymentSuccessRatePercent}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Wins & Top Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border">
          <CardHeader className="py-2.5 px-4 border-b">
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Top Wins & Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2 text-xs">
            {report.topWins.map((win, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-emerald-500/5 p-2 rounded border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{win}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="py-2.5 px-4 border-b">
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" /> Top Risks & Watch Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2 text-xs">
            {report.topRisks.map((risk, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-amber-500/5 p-2 rounded border border-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>{risk}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Actions & Next Sprint Focus */}
      <Card className="border bg-card">
        <CardHeader className="py-2.5 px-4 border-b">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" /> Strategic Next Actions & Focus
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Recommended Strategic Actions</span>
            {report.recommendedActions.map((action, idx) => (
              <p key={idx} className="text-foreground/90 font-medium pl-3 border-l-2 border-indigo-500">
                {action}
              </p>
            ))}
          </div>

          <div className="pt-2 border-t mt-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Next Sprint Goal</span>
            <p className="text-xs font-semibold text-indigo-400 mt-0.5">{report.nextSprintFocus}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
