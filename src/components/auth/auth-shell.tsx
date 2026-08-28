import React from 'react';
import { MissionControlPreview } from '@/components/shared/mission-control-preview';
import { GlassCard } from '@/packages/ui';
import { Bot, Sparkles, Shield, Cpu } from 'lucide-react';

/**
 * Ultra-Modern Cyber Void Auth Shell.
 * Provides an atmospheric dual-pane layout with ambient neon gradients and mission control live preview.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-void flex items-center justify-center p-4 lg:p-8 font-sans text-white">
      {/* Background Cyber Glow Gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(99,102,241,0.25),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.15),transparent_50%)]" />

      <div className="relative z-10 mx-auto grid min-h-[85vh] w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left Column: Form Container */}
        <div className="mx-auto w-full max-w-md lg:mx-0">{children}</div>

        {/* Right Column: AI Organization Feature Showcase */}
        <div className="hidden lg:flex flex-col justify-center space-y-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <Sparkles className="h-3.5 w-3.5" />
              Autonomous AI Organization
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
              Your autonomous software engineering company, ready to build.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60 max-w-lg">
              Sign in to Mission Control — direct your AI employees (Product Manager, Architect, Designer, Developer, QA) as they collaborate to ship full-stack code.
            </p>
          </div>

          <GlassCard className="p-6 border-white/10 shadow-2xl bg-surface-glass/90">
            <MissionControlPreview dense />
          </GlassCard>

          {/* Security & Capability Badges */}
          <div className="flex items-center gap-6 pt-2 text-xs font-mono text-white/40">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>AES-256-GCM Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-secondary" />
              <span>Multi-LLM BYOK</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
