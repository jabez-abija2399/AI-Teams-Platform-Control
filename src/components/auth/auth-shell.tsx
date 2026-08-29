import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { Shield, Sparkles } from 'lucide-react';
import { CyberShader } from '@/components/ui/cyber-shader';

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
    <main className="bg-background text-foreground min-h-screen flex flex-col md:flex-row overflow-hidden font-sans selection:bg-primary selection:text-background">
      {/* SECTION 1: LEFT PANEL - BRAND INTRO */}
      <div className="hidden md:flex w-1/2 relative bg-background border-r border-white/10 flex-col justify-between overflow-hidden">
        <CyberShader className="absolute inset-0 w-full h-full pointer-events-none opacity-50 z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background z-10" />

        {/* Simulated Code Logs Stream */}
        <div aria-hidden="true" className="absolute inset-0 z-0 opacity-25 pointer-events-none overflow-hidden font-mono text-xs text-primary flex items-start">
          <div className="log-stream whitespace-pre w-full pt-10 px-8">
            {simulatedLogs}
            {'\n'}
            {simulatedLogs}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-20 p-12 flex flex-col h-full">
          <div>
            <Link href="/" className="font-heading text-2xl font-bold flex items-center gap-3 mb-10 text-white group w-fit">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-primary/40 text-primary shadow-[0_0_12px_rgba(0,242,254,0.25)] group-hover:scale-105 transition-transform">
                <Logo size={24} />
              </div>
              <span className="group-hover:text-primary transition-colors">HibirDev</span>
            </Link>
            <h1 className="font-heading text-4xl lg:text-5xl font-extrabold mb-6 text-white leading-tight">
              Orchestrate<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F2FE] to-[#00ACAC]">
                with Precision.
              </span>
            </h1>
            <p className="text-sm md:text-base leading-relaxed text-on-surface-variant max-w-md border-l-2 border-primary pl-4 mb-8">
              Autonomous AI orchestration built for developers. We enforce a strict Bring Your Own Key (BYOK) protocol to ensure zero-knowledge data retention across all workspace operations.
            </p>
            <div className="flex items-center gap-2 font-mono text-xs text-primary bg-primary/10 w-max px-3 py-1.5 border border-primary/30 rounded-full font-bold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
              SYSTEM STATUS: ONLINE
            </div>
          </div>
          <div className="mt-auto pt-8">
            <div className="font-mono text-xs text-on-surface-variant flex items-center gap-2 font-bold">
              <Shield className="w-4 h-4 text-primary" />
              AES-256 ENCRYPTED NODE VAULT
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 & 3: RIGHT PANEL - SIGN-IN CARD & GATEWAY */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 relative bg-background z-10">
        <div className="w-full max-w-md relative">{children}</div>
      </div>
    </main>
  );
}
