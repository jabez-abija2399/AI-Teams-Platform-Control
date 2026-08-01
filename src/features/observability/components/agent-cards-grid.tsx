'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export interface EmployeeAgent {
  id: string;
  role: string;
  avatar: string;
  status: 'active' | 'idle' | 'completed';
  currentTask: string;
  duration: string;
  qualityScore: number;
  progress: number;
}

export const SEVENTEEN_EMPLOYEES: EmployeeAgent[] = [
  { id: '1', role: 'CEO AI', avatar: '💼', status: 'completed', currentTask: 'Vision & Strategy', duration: '12s', qualityScore: 99, progress: 100 },
  { id: '2', role: 'Product Manager', avatar: '📋', status: 'completed', currentTask: 'User Stories & Roadmap', duration: '18s', qualityScore: 97, progress: 100 },
  { id: '3', role: 'System Architect', avatar: '🏛️', status: 'completed', currentTask: 'Microservice Design', duration: '24s', qualityScore: 98, progress: 100 },
  { id: '4', role: 'DB Architect', avatar: '🗄️', status: 'completed', currentTask: 'Prisma Schema & Indexes', duration: '15s', qualityScore: 99, progress: 100 },
  { id: '5', role: 'Backend Engineer', avatar: '⚙️', status: 'completed', currentTask: 'REST API & Handlers', duration: '45s', qualityScore: 96, progress: 100 },
  { id: '6', role: 'Frontend Lead', avatar: '🎨', status: 'completed', currentTask: 'Tailwind UI & Layout', duration: '50s', qualityScore: 97, progress: 100 },
  { id: '7', role: 'UI/UX Designer', avatar: '✨', status: 'completed', currentTask: 'Glassmorphism Design System', duration: '22s', qualityScore: 98, progress: 100 },
  { id: '8', role: 'QA Automation', avatar: '🧪', status: 'completed', currentTask: 'Vitest Unit & Integration', duration: '30s', qualityScore: 99, progress: 100 },
  { id: '9', role: 'SecOps Engineer', avatar: '🛡️', status: 'completed', currentTask: 'OWASP Security Scan', duration: '14s', qualityScore: 100, progress: 100 },
  { id: '10', role: 'DevOps Lead', avatar: '🚀', status: 'active', currentTask: 'Docker & E2B Cloud Sandbox', duration: '10s', qualityScore: 98, progress: 85 },
  { id: '11', role: 'Performance Engineer', avatar: '⚡', status: 'idle', currentTask: 'Lighthouse & Bundle Size', duration: '0s', qualityScore: 95, progress: 0 },
  { id: '12', role: 'Docs Specialist', avatar: '📚', status: 'completed', currentTask: 'Swagger & README', duration: '12s', qualityScore: 98, progress: 100 },
  { id: '13', role: 'Code Reviewer AI', avatar: '🔍', status: 'completed', currentTask: 'Self-Reflective Self-Healing', duration: '16s', qualityScore: 99, progress: 100 },
  { id: '14', role: 'Customer Success', avatar: '🎧', status: 'idle', currentTask: 'User Feedback Collector', duration: '0s', qualityScore: 96, progress: 0 },
  { id: '15', role: 'Data Engineer', avatar: '📊', status: 'completed', currentTask: 'Telemetry & Analytics', duration: '20s', qualityScore: 97, progress: 100 },
  { id: '16', role: 'Release Manager', avatar: '📦', status: 'active', currentTask: 'Changelog & Semantic Tag', duration: '8s', qualityScore: 98, progress: 70 },
  { id: '17', role: 'FinOps AI', avatar: '💰', status: 'completed', currentTask: 'Token Cost Optimization', duration: '10s', qualityScore: 99, progress: 100 },
];

export function AgentCardsGrid() {
  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-sky-500" />
          <CardTitle className="text-sm font-bold">AI Company Roster (17 Autonomous Employees)</CardTitle>
        </div>
        <Badge variant="secondary" className="text-[10px] font-mono">
          17/17 Active Agents
        </Badge>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {SEVENTEEN_EMPLOYEES.map((agent) => (
            <div
              key={agent.id}
              className={`p-3 rounded-lg border flex flex-col justify-between space-y-2 transition-all ${
                agent.status === 'active'
                  ? 'bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/20'
                  : 'bg-card border-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{agent.avatar}</span>
                  <div>
                    <h5 className="text-xs font-bold leading-tight">{agent.role}</h5>
                    <span className="text-[10px] text-muted-foreground font-mono">{agent.duration}</span>
                  </div>
                </div>
                <Badge
                  variant={agent.status === 'active' ? 'default' : agent.status === 'completed' ? 'outline' : 'secondary'}
                  className="text-[9px] px-1.5 py-0"
                >
                  {agent.status}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground truncate">{agent.currentTask}</p>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span>Quality: {agent.qualityScore}%</span>
                  <span>{agent.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${agent.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
