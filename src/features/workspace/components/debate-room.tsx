'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  AlertTriangle,
  Gavel,
  CheckCircle,
  Database,
  Cpu,
  Layers,
  Bot,
  Terminal,
  Brain,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export function DebateRoom() {
  const [resolved, setResolved] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(14);

  const handleVote = (choice: string) => {
    setResolved(choice);
    toast.success('Executive Decision Recorded', {
      description: `Forced override applied: ${choice}`,
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-background text-on-background overflow-hidden relative">
      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto pb-32 space-y-8 scrollbar-hide">
        {/* SECTION 1: ARENA CONFLICT TITLE */}
        <header className="border border-white/10 bg-surface-container-low brutalist-offset-container p-6 relative">
          <div className="brutal-offset-bg"></div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-danger text-danger font-mono text-xs mb-4 uppercase bg-danger/10 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> Active Conflict Resolution
              </div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-on-surface mb-2">
                DB Schema Alignment
              </h1>
              <p className="font-mono text-xs text-on-surface-variant max-w-2xl leading-relaxed">
                System halted pending architectural decision. Two critical agents have proposed mutually exclusive models for the new orchestration engine backend.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-surface-container p-3 border border-white/10">
              <div className="text-right">
                <p className="font-mono text-[10px] text-on-surface-variant uppercase">Architect</p>
                <p className="font-heading text-lg font-bold text-primary">Marcus</p>
              </div>
              <span className="font-heading text-xl font-bold text-on-surface-variant px-2">VS</span>
              <div className="text-left">
                <p className="font-mono text-[10px] text-on-surface-variant uppercase">Developer</p>
                <p className="font-heading text-lg font-bold text-secondary">Alex</p>
              </div>
            </div>
          </div>
        </header>

        {/* SECTION 3: DECISION PROBABILITY METER */}
        <section className="border border-white/10 bg-surface p-6">
          <div className="flex justify-between items-center mb-4 font-mono text-xs">
            <h3 className="font-bold text-on-surface uppercase tracking-wider">Consensus Probability</h3>
            <span className="text-primary font-bold">78% Confidence: Relational</span>
          </div>
          <div className="h-8 w-full border border-white/10 bg-surface-container relative overflow-hidden flex">
            <div className="h-full bg-primary transition-all duration-1000" style={{ width: '78%' }} />
            <div className="h-full bg-surface-container-highest transition-all duration-1000" style={{ width: '22%' }} />
          </div>
          <div className="flex justify-between mt-2 font-mono text-[11px] text-on-surface-variant">
            <span>Relational (PostgreSQL) — 78%</span>
            <span>Document (MongoDB) — 22%</span>
          </div>
        </section>

        {/* SECTION 2: MULTI-AGENT CHAT BUBBLES */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="text-primary w-4 h-4" />
            <h2 className="font-mono text-xs font-bold text-on-surface uppercase tracking-widest">
              Live Debate Log
            </h2>
            <div className="flex-1 h-px bg-white/10 ml-4" />
          </div>

          {/* PM Sarah Context Inject */}
          <div className="flex flex-col items-center max-w-3xl mx-auto opacity-80">
            <div className="bg-surface-container-high border border-white/10 px-4 py-1.5 flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="font-mono text-[10px] font-bold text-on-surface-variant uppercase">
                PM Sarah (Context Inject)
              </span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="font-mono text-xs text-on-surface-variant text-center border border-white/10 p-4 bg-surface-container-low leading-relaxed">
              "Requirement: The new orchestration engine must handle hierarchical task trees with unknown depth, while ensuring strict transactional integrity across agent handoffs."
            </div>
            <div className="h-6 w-px bg-white/10" />
          </div>

          {/* Architect Marcus (Left) */}
          <div className="flex flex-col items-start max-w-2xl">
            <div className="flex items-center gap-2 mb-2 pl-2">
              <div className="w-2 h-2 bg-primary"></div>
              <span className="font-mono text-xs font-bold text-on-surface uppercase">Marcus (Architect)</span>
              <span className="font-mono text-[10px] text-on-surface-variant ml-2">T-0.4s</span>
            </div>
            <div className="bg-[#464545] border border-white/10 p-5 offset-shadow">
              <p className="text-sm text-on-surface mb-3 leading-relaxed">
                Transactional integrity dictates a relational approach. CTEs (Common Table Expressions) in PostgreSQL perfectly solve the hierarchical depth requirement without sacrificing ACID compliance during handoffs.
              </p>
              <div className="bg-surface-container-lowest p-3 border border-white/10 font-mono text-xs text-on-surface-variant">
                &gt; Executing query simulation: CTE recursive depth stress test... PASSED (p99 &lt; 45ms)
              </div>
            </div>
          </div>

          {/* Developer Alex (Right) */}
          <div className="flex flex-col items-end max-w-2xl ml-auto">
            <div className="flex items-center gap-2 mb-2 pr-2">
              <span className="font-mono text-[10px] text-on-surface-variant mr-2">T-0.8s</span>
              <span className="font-mono text-xs font-bold text-on-surface uppercase">Alex (Developer)</span>
              <div className="w-2 h-2 bg-secondary"></div>
            </div>
            <div className="bg-surface-container border border-white/10 p-5 brutal-border text-right">
              <p className="text-sm text-on-surface mb-3 leading-relaxed">
                Hard disagree. The schema payload from external AI agents is highly volatile. Forcing it into rigid relational columns will break our ingestion pipelines daily. Document JSON gives us the schema flexibility needed for unstructured AI outputs.
              </p>
              <div className="inline-flex gap-2 items-center bg-surface-container-lowest px-3 py-1 border border-white/10 font-mono text-[11px] text-warning">
                <AlertTriangle className="w-3.5 h-3.5" />
                Risk factor: Schema Drift
              </div>
            </div>
          </div>

          {/* Architect Marcus Rebuttal (Left) */}
          <div className="flex flex-col items-start max-w-2xl">
            <div className="flex items-center gap-2 mb-2 pl-2">
              <div className="w-2 h-2 bg-primary"></div>
              <span className="font-mono text-xs font-bold text-on-surface uppercase">Marcus (Architect)</span>
              <span className="font-mono text-[10px] text-on-surface-variant ml-2">T-1.2s</span>
            </div>
            <div className="bg-[#464545] border border-white/10 p-5 offset-shadow">
              <p className="text-sm text-on-surface leading-relaxed">
                PostgreSQL has native JSONB support. We can store volatile payload data in JSONB columns while keeping the critical orchestration metadata (Task ID, Parent ID, Status) in strict relational columns. It's not mutually exclusive.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 4: EXECUTIVE CAST VOTE BAR */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-primary bg-surface-container-high z-40 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Gavel className="text-primary w-5 h-5" />
            <div>
              <h4 className="font-mono text-xs font-bold text-on-surface uppercase">Executive Intervention Required</h4>
              <p className="font-mono text-[11px] text-on-surface-variant">
                {resolved ? `Decision override applied: ${resolved}` : 'Awaiting human override or auto-resolution.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3 w-full md:w-auto">
            <button
              onClick={() => handleVote('Document JSON')}
              type="button"
              className="border border-white/10 bg-transparent text-on-surface font-mono text-xs font-bold px-4 py-3 uppercase hover:bg-surface-container-highest transition-colors"
            >
              Force Document JSON
            </button>
            <button
              onClick={() => handleVote('Auto-Resolved')}
              type="button"
              className="border border-white/10 bg-transparent text-on-surface font-mono text-xs font-bold px-4 py-3 uppercase hover:bg-surface-container-highest transition-colors"
            >
              Let Auto-Resolve ({countdown}s)
            </button>
            <button
              onClick={() => handleVote('Relational Model')}
              type="button"
              className="bg-primary text-background border border-primary font-mono text-xs font-bold px-6 py-3 uppercase hover:bg-transparent hover:text-primary transition-colors offset-shadow"
            >
              Force Relational Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
