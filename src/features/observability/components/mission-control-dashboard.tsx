'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Brain, CheckCircle2, Clock, DollarSign, FileCode, Layers, MessageSquare, Sparkles, Terminal, UserCheck, Zap, AlertCircle, Award, Users } from 'lucide-react';
import { ExecutionDagGraph } from './execution-dag-graph';
import { AgentCardsGrid } from './agent-cards-grid';
import { AgentCollaborationTimeline } from '@/features/collaboration/components/agent-collaboration-timeline';
import { ExecutiveReportView } from '@/features/analytics/components/executive-report-view';

interface MissionControlData {
  dashboard: {
    status: string;
    currentPhase: string;
    activeAgents: string[];
    completedTasks: number;
    remainingTasks: number;
    progress: number;
    currentDepartment?: string;
    currentArtifact?: string | null;
    nextAction?: string | null;
    waitingApprovals?: string[];
    risks?: string[];
  };
  agents: Array<{
    role: string;
    tasksCompleted: number;
    successRate: number;
    averageDuration: number;
    tokenUsage: number;
    cost: number;
  }>;
  timeline: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
  collaboration: Array<{
    from: string;
    to: string | null;
    message: string;
    type: string;
    timestamp: string;
  }>;
}

export function MissionControlDashboard({ projectId }: { projectId: string }) {
  const [data, setData] = useState<MissionControlData | null>(null);
  const [mode, setMode] = useState<'creator' | 'developer'>('creator');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchObservabilityData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/observability`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error || 'Failed to fetch observability metrics');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleApprove = async (approvalType: string) => {
    try {
      await fetch(`/api/projects/${projectId}/lifecycle/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalType, status: 'APPROVED' }),
      });
      fetchObservabilityData();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchObservabilityData();
    const interval = setInterval(fetchObservabilityData, 3000);
    return () => clearInterval(interval);
  }, [fetchObservabilityData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Activity className="h-6 w-6 animate-spin mr-2 text-primary" />
        <span>Connecting to Mission Control telemetry...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6 text-center text-destructive">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">Unable to load telemetry</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const { dashboard, agents, timeline, collaboration } = data;
  const totalCost = agents.reduce((acc, a) => acc + a.cost, 0);
  const totalTokens = agents.reduce((acc, a) => acc + a.tokenUsage, 0);

  const creatorSteps = [
    { title: 'AI understands your idea', role: 'CEO', icon: Brain, done: dashboard.progress >= 20 },
    { title: 'AI designs your product', role: 'ARCHITECT', icon: Layers, done: dashboard.progress >= 40 },
    { title: 'AI engineers build it', role: 'DEVELOPER', icon: FileCode, done: dashboard.progress >= 70 },
    { title: 'AI tests quality', role: 'QA', icon: UserCheck, done: dashboard.progress >= 90 },
    { title: 'Your product is ready', role: 'DEPLOY', icon: CheckCircle2, done: dashboard.progress >= 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-bold tracking-tight">Mission Control</h2>
            <Badge variant={dashboard.status === 'RUNNING' ? 'default' : 'secondary'} className="uppercase">
              {dashboard.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Real-time autonomous telemetry & agent collaboration feed</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-muted p-1 rounded-lg flex items-center gap-1">
            <Button
              size="sm"
              variant={mode === 'creator' ? 'default' : 'ghost'}
              className="text-xs h-7"
              onClick={() => setMode('creator')}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Creator Mode
            </Button>
            <Button
              size="sm"
              variant={mode === 'developer' ? 'default' : 'ghost'}
              className="text-xs h-7"
              onClick={() => setMode('developer')}
            >
              <Terminal className="h-3.5 w-3.5 mr-1" /> Developer Mode
            </Button>
          </div>
        </div>
      </div>

      {/* Autonomous Delivery Pipeline Status */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-xl border border-indigo-500/30 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/40">
              <Zap className="h-6 w-6 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Autonomous Delivery Pipeline</h3>
                <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                  {dashboard.currentDepartment || 'Company Operations'}
                </Badge>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Active Agent: <span className="font-semibold text-white">{dashboard.activeAgents.join(', ') || 'IDLE'}</span> | Current Artifact: <span className="font-mono text-emerald-300">{dashboard.currentArtifact || 'None'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-right">
            <span className="text-xs text-indigo-300 font-medium">Next Scheduled Action:</span>
            <span className="text-xs bg-black/40 px-2.5 py-1 rounded border border-white/10 text-indigo-100 max-w-sm truncate">
              {dashboard.nextAction || 'Executing autonomous steps...'}
            </span>
          </div>
        </div>

        {/* Approval Gates & Risks Alert */}
        {((dashboard.waitingApprovals && dashboard.waitingApprovals.length > 0) || (dashboard.risks && dashboard.risks.length > 0)) && (
          <div className="pt-2 border-t border-white/10 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
            {dashboard.waitingApprovals && dashboard.waitingApprovals.length > 0 && (
              <div className="flex items-center gap-3 bg-amber-500/20 border border-amber-500/50 px-3 py-2 rounded-lg text-amber-200 text-xs w-full md:w-auto">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold">Human Approval Gate Required: </span>
                  <span>{dashboard.waitingApprovals[0]}</span>
                </div>
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-7 px-3 ml-auto text-xs cursor-pointer"
                  onClick={() => handleApprove(dashboard.waitingApprovals![0]!)}
                >
                  Grant Approval
                </Button>
              </div>
            )}

            {dashboard.risks && dashboard.risks.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-red-300 bg-red-950/40 px-3 py-2 rounded-lg border border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>Risk Identified: {dashboard.risks[0]}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 text-white border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Total Execution Cost</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center text-emerald-400">
              <DollarSign className="h-5 w-5 mr-1" />
              ${totalCost.toFixed(4)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-400">
            {totalTokens.toLocaleString()} total tokens consumed
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Progress</CardDescription>
            <CardTitle className="text-2xl font-bold">{Math.round(dashboard.progress)}%</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300" 
                style={{ width: `${Math.min(100, Math.max(0, dashboard.progress))}%` }} 
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.completedTasks} completed, {dashboard.remainingTasks} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active AI Employees</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center">
              <Zap className="h-5 w-5 text-amber-500 mr-2" />
              {dashboard.activeAgents.length > 0 ? dashboard.activeAgents.length : 'Idle'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground truncate">
            {dashboard.activeAgents.length > 0 ? dashboard.activeAgents.join(', ') : 'Waiting for next task...'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Project Phase</CardDescription>
            <CardTitle className="text-lg font-bold truncate capitalize">{dashboard.currentPhase}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Current system execution state
          </CardContent>
        </Card>
      </div>

      {/* Main View: Creator vs Developer Mode */}
      <Tabs defaultValue="dag" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto p-1 bg-muted">
          <TabsTrigger value="dag" className="text-xs">Live Execution DAG</TabsTrigger>
          <TabsTrigger value="roster" className="text-xs">17 Agent Roster</TabsTrigger>
          <TabsTrigger value="collaboration" className="text-xs">Real-Time Chat Stream</TabsTrigger>
          <TabsTrigger value="executive" className="text-xs">Executive Brief</TabsTrigger>
          <TabsTrigger value="agents" className="text-xs">Agent Analytics</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="dag">
          <ExecutionDagGraph />
        </TabsContent>

        <TabsContent value="roster">
          <AgentCardsGrid />
        </TabsContent>

        <TabsContent value="collaboration">
          <AgentCollaborationTimeline projectId={projectId} />
        </TabsContent>

        <TabsContent value="executive">
          <ExecutiveReportView projectId={projectId} />
        </TabsContent>

        <TabsContent value="agents">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <Card key={agent.role} className="border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">{agent.role}</Badge>
                    <span className="text-xs text-muted-foreground">${agent.cost.toFixed(4)}</span>
                  </div>
                  <CardTitle className="text-base font-bold mt-2">{agent.role} Agent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tasks Done:</span>
                    <span className="font-semibold">{agent.tasksCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Success Rate:</span>
                    <span className="font-semibold text-emerald-500">{Math.round(agent.successRate)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Latency:</span>
                    <span className="font-semibold">{(agent.averageDuration / 1000).toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tokens:</span>
                    <span className="font-semibold">{agent.tokenUsage.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                System Execution Audit Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {timeline.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No execution events recorded.</p>
              ) : (
                timeline.map((evt) => (
                  <div key={evt.id} className="flex items-start gap-3 p-2 rounded border-b last:border-0 text-xs">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">{evt.type}</Badge>
                    <div className="flex-1">
                      <p>{evt.message}</p>
                      <span className="text-[10px] text-muted-foreground">{new Date(evt.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
