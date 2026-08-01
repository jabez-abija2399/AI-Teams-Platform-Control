'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, Activity, ShieldCheck, Zap } from 'lucide-react';

export interface DAGNode {
  id: string;
  role: string;
  avatar: string;
  status: 'completed' | 'active' | 'pending';
}

const DAG_NODES: DAGNode[] = [
  { id: 'ceo', role: 'CEO', avatar: '💼', status: 'completed' },
  { id: 'product', role: 'Product', avatar: '📋', status: 'completed' },
  { id: 'architect', role: 'Architect', avatar: '🏛️', status: 'completed' },
  { id: 'database', role: 'Database', avatar: '🗄️', status: 'completed' },
  { id: 'backend', role: 'Backend', avatar: '⚙️', status: 'completed' },
  { id: 'frontend', role: 'Frontend', avatar: '🎨', status: 'completed' },
  { id: 'qa', role: 'QA', avatar: '🧪', status: 'completed' },
  { id: 'security', role: 'Security', avatar: '🛡️', status: 'completed' },
  { id: 'deploy', role: 'Deploy', avatar: '🚀', status: 'active' },
];

export function ExecutionDagGraph() {
  return (
    <Card className="border bg-gradient-to-br from-background via-card to-muted/20 shadow-xs">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-500 animate-pulse" />
          <CardTitle className="text-sm font-bold">Autonomous Execution Graph (DAG)</CardTitle>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 border-emerald-500/30">
          Live Pipeline Stream
        </Badge>
      </CardHeader>

      <CardContent className="p-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[750px] gap-2">
          {DAG_NODES.map((node, index) => (
            <React.Fragment key={node.id}>
              <div
                className={`flex flex-col items-center p-2.5 rounded-lg border transition-all duration-300 relative ${
                  node.status === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : node.status === 'active'
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-500 shadow-sm ring-1 ring-indigo-500/30 animate-pulse'
                    : 'bg-muted/40 border-border/50 text-muted-foreground opacity-50'
                }`}
              >
                <span className="text-xl mb-1">{node.avatar}</span>
                <span className="text-xs font-bold">{node.role}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-80 mt-0.5">
                  {node.status}
                </span>
              </div>

              {index < DAG_NODES.length - 1 && (
                <div className="flex items-center text-muted-foreground/40">
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
