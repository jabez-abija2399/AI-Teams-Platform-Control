'use client';

import React from 'react';
import { Terminal, Cpu, Activity, Play, CheckCircle2, ShieldCheck, RefreshCw, Server } from 'lucide-react';

export function MissionControl() {
  return (
    <div className="flex-1 flex flex-col h-full bg-background text-on-background p-6 md:p-8 max-w-7xl mx-auto w-full gap-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-primary font-bold mb-1">
            <Activity className="w-4 h-4" />
            <span>MISSION CONTROL / RUNTIME TELEMETRY</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-white">Autonomous Agent Runtime</h1>
          <p className="font-sans text-xs text-on-surface-variant">
            Live compute telemetry and agent execution logs for active workspace cluster.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/40 px-3 py-1.5 rounded-lg font-mono text-xs text-primary font-bold">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>STATUS: BUILDING (ACTIVE)</span>
          </div>
        </div>
      </div>

      {/* Telemetry Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-surface border border-white/10 p-5 rounded-xl">
          <span className="text-on-surface-variant text-[10px] uppercase font-bold block mb-1 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-primary" /> CPU UTILIZATION
          </span>
          <div className="text-2xl font-bold text-white mb-2">42.8%</div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[42%]" />
          </div>
        </div>

        <div className="bg-surface border border-white/10 p-5 rounded-xl">
          <span className="text-on-surface-variant text-[10px] uppercase font-bold block mb-1 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-primary" /> CLUSTER MEMORY
          </span>
          <div className="text-2xl font-bold text-white mb-2">1.8 / 4.0 GB</div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[45%]" />
          </div>
        </div>

        <div className="bg-surface border border-white/10 p-5 rounded-xl">
          <span className="text-on-surface-variant text-[10px] uppercase font-bold block mb-1 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" /> AGENT THREADS
          </span>
          <div className="text-2xl font-bold text-primary mb-2">4 ACTIVE</div>
          <p className="text-[10px] text-on-surface-variant">CEO, Arch, Designer, Dev</p>
        </div>

        <div className="bg-surface border border-white/10 p-5 rounded-xl">
          <span className="text-on-surface-variant text-[10px] uppercase font-bold block mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> CONTEXT RETENTION
          </span>
          <div className="text-2xl font-bold text-white mb-2">100% BYOK</div>
          <p className="text-[10px] text-on-surface-variant">Zero-knowledge vault active</p>
        </div>
      </div>

      {/* Real-time Agent Log Stream Terminal */}
      <div className="bg-surface border border-white/10 rounded-xl overflow-hidden flex flex-col font-mono text-xs">
        <div className="bg-background px-4 py-3 border-b border-white/10 flex justify-between items-center text-on-surface-variant text-[11px]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-white font-bold">LIVE EXECUTION CONSOLE</span>
          </div>
          <span>NODE: 0x9f3A</span>
        </div>

        <div className="p-4 bg-background space-y-2 min-h-[260px] text-on-surface-variant overflow-y-auto">
          <div className="text-primary">[11:15:02] [SYS] Mounting workspace workspace node: 0x9f3A</div>
          <div>[11:15:04] [CEO_AGENT] Synthesized Product Requirements Document (PRD_StudyMate_v1.md)</div>
          <div>[11:15:08] [ARCHITECT_AGENT] Generated microservices graph and PostgreSQL database schemas</div>
          <div className="text-primary font-bold">[11:15:14] [DESIGNER_AGENT] Compiling design tokens and tailwind palette guidelines</div>
          <div>[11:15:18] [DEVELOPER_AGENT] Awaiting designer approval milestone to start code generation...</div>
          <div className="text-primary animate-pulse">[11:15:22] [LIVE_STREAM] Pipeline running nominally at 44ms gateway latency...</div>
        </div>
      </div>
    </div>
  );
}
