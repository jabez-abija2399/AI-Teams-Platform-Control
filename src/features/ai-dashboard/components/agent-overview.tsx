'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchAgentSummaries } from '@/app/dashboard/ai-teams/actions';
import type { AgentSummaryData } from '@/app/dashboard/ai-teams/actions';

export function AgentOverview() {
  const [agents, setAgents] = useState<AgentSummaryData[]>([]);

  useEffect(() => {
    fetchAgentSummaries().then(setAgents).catch(() => {});
  }, []);

  const statusColor: Record<string, string> = {
    IDLE: 'bg-green-100 text-green-800',
    WORKING: 'bg-blue-100 text-blue-800',
    BLOCKED: 'bg-red-100 text-red-800',
    OFFLINE: 'bg-gray-100 text-gray-800',
    ERROR: 'bg-red-100 text-red-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Agents</CardTitle>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No agents active. Start a workflow to spawn agents.
          </p>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-muted-foreground text-xs">{agent.role}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={statusColor[agent.status] ?? 'bg-gray-100 text-gray-800'}
                >
                  {agent.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
