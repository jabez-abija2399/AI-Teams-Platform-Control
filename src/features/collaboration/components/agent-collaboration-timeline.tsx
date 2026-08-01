'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AgentChatMessage } from '../services/collaboration-stream.service';
import { MessageSquare, Sparkles, Terminal, CheckCircle2, Cpu, Clock, Layers } from 'lucide-react';

export function AgentCollaborationTimeline({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/collaboration/stream`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stream) {
          setMessages(data.stream);
        }
      })
      .catch(() => null);
  }, [projectId]);

  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-500" />
          <CardTitle className="text-sm font-bold">Real-Time AI Agent Collaboration Feed</CardTitle>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDeveloperMode(!isDeveloperMode)}
          className="text-xs h-7 gap-1.5"
        >
          {isDeveloperMode ? (
            <>
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              Creator Mode
            </>
          ) : (
            <>
              <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
              Developer Telemetry
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg border flex flex-col space-y-2 transition-all ${
              msg.isApprovalMessage
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-muted/30 border-border/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{msg.avatarUrl}</span>
                <span className="text-xs font-bold">{msg.agentName}</span>
                {msg.targetRole && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">
                    → {msg.targetRole}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <p className="text-xs text-foreground/90 font-medium pl-1">{msg.message}</p>

            {/* Decision Highlight */}
            {msg.decision && (
              <div className="bg-indigo-500/10 p-2 rounded border border-indigo-500/20 text-[11px]">
                <span className="font-bold text-indigo-400">Architectural Decision: </span>
                <span>{msg.decision.topic} — {msg.decision.choice}</span>
              </div>
            )}

            {/* Developer Mode Deep Telemetry */}
            {isDeveloperMode && msg.devMetadata && (
              <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-800">
                <div>Tokens: <span className="text-sky-400">{msg.devMetadata.tokenUsage}</span></div>
                <div>Latency: <span className="text-amber-400">{msg.devMetadata.latencyMs}ms</span></div>
                <div>Model: <span className="text-indigo-400">{msg.devMetadata.model}</span></div>
                <div>Retries: <span className="text-emerald-400">{msg.devMetadata.retryCount}</span></div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
