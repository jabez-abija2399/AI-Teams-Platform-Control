import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { Shield } from 'lucide-react';

export function AuthShell({ children }: { children: React.ReactNode }) {
  const simulatedLogs = `
[SYS] Initializing Node 0x9f3A...
[AUTH] Verifying localized key signatures
[NET] Establishing encrypted tunnel to Cluster A
[SYS] Loading orchestration modules... [OK]
[DATA] Injecting LLM context weights
[SYS] Awaiting BYOK validation...
[AUTH] Ready for session initialization.
[SYS] Initializing Node 0x9f3A...
[AUTH] Verifying localized key signatures
[NET] Establishing encrypted tunnel to Cluster A
[SYS] Loading orchestration modules... [OK]
[DATA] Injecting LLM context weights
[SYS] Awaiting BYOK validation...
[AUTH] Ready for session initialization.
  `.trim();

  return (
    <main className="bg-background text-on-background min-h-screen flex flex-col md:flex-row overflow-hidden font-body-md selection:bg-primary selection:text-on-primary">
      {/* SECTION 1: LEFT PANEL - BRAND INTRO */}
      <div className="hidden md:flex w-1/2 relative bg-black border-r border-[rgba(223,222,220,0.1)] flex-col justify-between overflow-hidden">
        {/* Grid & Background Effects */}
        <div className="absolute inset-0 grid-overlay z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black z-10"></div>
        
        {/* Simulated Logs */}
        <div aria-hidden="true" className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden font-mono text-xs text-primary flex items-start">
          <div className="log-stream whitespace-pre w-full pt-10 px-8">
            {simulatedLogs}
            {"\n"}
            {simulatedLogs}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-20 p-12 flex flex-col h-full">
          <div>
            <div className="font-heading text-2xl font-bold flex items-center gap-2 mb-8 text-white">
              <Logo size={32} className="text-primary" />
              HibirDev
            </div>
            <h1 className="font-heading text-4xl lg:text-5xl font-bold mb-6 text-white leading-tight">
              Orchestrate<br />with Precision.
            </h1>
            <p className="text-base leading-relaxed text-on-surface-variant max-w-md border-l-2 border-primary pl-4 mb-8">
              Autonomous AI orchestration built for developers. We enforce a strict Bring Your Own Key (BYOK) protocol to ensure zero-knowledge data retention across all workspace operations.
            </p>
            <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant bg-surface-container-high w-max px-3 py-1.5 border border-[rgba(223,222,220,0.1)]">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
              SYSTEM STATUS: ONLINE
            </div>
          </div>
          <div className="mt-auto">
            <div className="font-mono text-xs text-on-surface-variant flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              AES-256 SECURED NODE
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 & 3: RIGHT PANEL - SIGN-IN CARD & GATEWAY */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 relative bg-background z-10">
        <div className="w-full max-w-md relative">
          {children}
        </div>
      </div>
    </main>
  );
}
