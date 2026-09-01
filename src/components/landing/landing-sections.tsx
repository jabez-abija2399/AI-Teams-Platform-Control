'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  RefreshCw,
  Hourglass,
  Sun,
  Moon,
  Menu,
  X,
  Brain,
  Layers,
  Sparkles,
  Terminal,
  ArrowRight,
  Shield,
  Zap,
  GitBranch,
  CheckCircle2,
} from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { APP_NAME, ROUTES } from '@/config/constants';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export function LandingHeader() {
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-outline-variant/60">
      <div className="flex justify-between items-center px-6 md:px-12 py-3.5 max-w-7xl mx-auto">
        <Link href={ROUTES.home} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-surface border border-primary/40 text-primary">
            <Logo size={18} />
          </div>
          <span className="font-mono text-sm font-bold text-primary tracking-tight">{APP_NAME}</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-mono text-xs font-medium">
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#agents">Agents</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#workflow">Workflow</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#features">Features</a>
          <Link className="text-on-surface-variant hover:text-primary transition-colors" href={ROUTES.dashboard}>Dashboard</Link>
        </div>

        <div className="flex items-center gap-3">
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded border border-outline-variant/60 hover:border-primary text-on-surface-variant hover:text-primary transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          )}
          <Link href={ROUTES.login}>
            <button className="font-mono text-xs text-on-surface-variant hover:text-primary font-medium px-3 py-1.5 transition-colors">
              Sign In
            </button>
          </Link>
          <Link href={ROUTES.register}>
            <button className="bg-primary text-black font-mono text-xs font-bold py-1.5 px-4 rounded hover:bg-primary-container transition-colors">
              Start Building
            </button>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((p) => !p)}
            className="md:hidden p-1.5 text-on-surface-variant hover:text-primary"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-outline-variant/60 bg-surface-container-low p-4 space-y-3 font-mono text-xs">
          <a href="#agents" onClick={() => setIsMobileMenuOpen(false)} className="block text-on-surface-variant py-1.5 hover:text-primary">Agents</a>
          <a href="#workflow" onClick={() => setIsMobileMenuOpen(false)} className="block text-on-surface-variant py-1.5 hover:text-primary">Workflow</a>
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block text-on-surface-variant py-1.5 hover:text-primary">Features</a>
          <Link href={ROUTES.register} onClick={() => setIsMobileMenuOpen(false)} className="block text-primary font-bold py-1.5">Start Building →</Link>
        </div>
      )}
    </nav>
  );
}

export function LandingHero() {
  return (
    <section className="pt-28 pb-16 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border border-outline-variant/60 p-6 md:p-10 bg-surface-container-low relative overflow-hidden">
        {/* Blueprint background hint */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden="true"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(60,73,73,0.5) 0.5px, transparent 0.5px), linear-gradient(to bottom, rgba(60,73,73,0.5) 0.5px, transparent 0.5px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="lg:col-span-6 flex flex-col justify-center gap-5 relative z-10">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-1 rounded-sm w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-wider">
              Autonomous Software Engineering
            </span>
          </div>

          <h1 className="font-sans text-4xl md:text-5xl font-bold text-on-surface leading-tight tracking-tight">
            Build Software With an{' '}
            <span className="text-primary">AI Team.</span>
          </h1>
          <p className="font-sans text-sm text-on-surface-variant max-w-lg leading-relaxed">
            HibirDev AI turns your idea into working software through four specialized agents — CEO, Architect, Designer, and Developer — running in a production-grade pipeline.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <Link href={ROUTES.register}>
              <button className="bg-primary text-black font-mono text-xs font-bold py-2.5 px-5 rounded hover:bg-primary-container transition-colors flex items-center gap-2">
                Start Building <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
            <Link href={ROUTES.login}>
              <button className="font-mono text-xs text-on-surface-variant border border-outline-variant/60 py-2.5 px-4 rounded hover:border-primary hover:text-primary transition-colors">
                Sign In
              </button>
            </Link>
          </div>
        </div>

        {/* Live pipeline visual */}
        <div className="lg:col-span-6 relative bg-background border border-outline-variant/60 rounded-sm p-4 md:p-5 z-10">
          <div className="font-mono text-[11px] text-on-surface-variant mb-3 flex justify-between items-center border-b border-outline-variant/40 pb-2.5">
            <span className="text-on-surface font-bold">PROJECT_ID: STUDYMATE</span>
            <span className="text-primary font-bold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              LIVE BUILD
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {[
              { label: 'CEO_AGENT', status: 'DONE', done: true },
              { label: 'ARCHITECT_AGENT', status: 'DONE', done: true },
              { label: 'DESIGNER_AGENT', status: 'ACTIVE', active: true },
              { label: 'DEVELOPER_AGENT', status: 'PENDING', pending: true },
            ].map((row) => (
              <div
                key={row.label}
                className={cn(
                  'flex items-center justify-between p-2.5 border',
                  row.active
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-outline-variant/40 bg-surface-container',
                  row.pending && 'opacity-50',
                )}
              >
                <div className="flex items-center gap-2">
                  {row.done && <Check className="w-3.5 h-3.5 text-primary" />}
                  {row.active && <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />}
                  {row.pending && <Hourglass className="w-3.5 h-3.5 text-on-surface-variant" />}
                  <span className={cn(row.done && 'line-through text-on-surface-variant', row.active && 'text-primary font-bold')}>{row.label}</span>
                </div>
                <span className={cn('text-[10px]', row.active ? 'text-primary font-bold' : 'text-on-surface-variant')}>
                  [{row.status}]
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-outline-variant/40 font-mono text-[10px] text-on-surface-variant flex justify-between">
            <span>Progress: 62%</span>
            <span className="text-primary">3 artifacts generated</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingWorkflowSpine() {
  const steps = ['IDEA', 'PRODUCT', 'ARCHITECTURE', 'DESIGN', 'CODE'];
  return (
    <section id="workflow" className="py-8 max-w-7xl mx-auto px-6 md:px-12">
      <div className="flex items-center gap-0 overflow-x-auto font-mono text-xs border border-outline-variant/40 bg-surface-container-low p-4">
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            <span className={cn('font-bold whitespace-nowrap', i === 0 || i === steps.length - 1 ? 'text-primary' : 'text-on-surface')}>{step}</span>
            {i < steps.length - 1 && (
              <div className="h-px flex-1 bg-outline-variant/40 min-w-8 mx-3 relative">
                <div className={cn('absolute left-0 top-0 h-full bg-primary', i < 2 ? 'w-full' : i < 3 ? 'w-1/2' : 'w-0')} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

const AGENTS = [
  {
    id: 'ceo',
    role: 'CEO',
    node: 'NODE_01',
    icon: Brain,
    description: 'Transforms raw ideas into structured product requirements, defines MVP scope, target audience, and success criteria.',
    output: 'Product Specification',
  },
  {
    id: 'architect',
    role: 'ARCHITECT',
    node: 'NODE_02',
    icon: Layers,
    description: 'Designs the complete technical system — database schema, API structure, file tree, technology stack, and implementation plan.',
    output: 'Architecture Specification',
  },
  {
    id: 'designer',
    role: 'DESIGNER',
    node: 'NODE_03',
    icon: Sparkles,
    description: 'Generates design tokens, component hierarchy, responsive layouts, and UI/UX specifications aligned with the product vision.',
    output: 'Design Specification',
  },
  {
    id: 'developer',
    role: 'DEVELOPER',
    node: 'NODE_04',
    icon: Terminal,
    description: 'Executes the implementation plan file-by-file, writing production-grade code across the full application stack.',
    output: 'Implementation Deliverable',
  },
];

export function LandingAgents() {
  return (
    <section id="agents" className="py-12 max-w-7xl mx-auto px-6 md:px-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] font-bold text-primary uppercase tracking-wider mb-1">AI Workforce</p>
          <h2 className="font-sans text-2xl md:text-3xl font-bold text-on-surface">Four Specialized Agents</h2>
        </div>
        <span className="font-mono text-[11px] text-on-surface-variant hidden md:block">PIPELINE_ARCHITECTURE_v2</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {AGENTS.map((agent, i) => {
          const Icon = agent.icon;
          return (
            <div key={agent.id} className="flex flex-col gap-3 border border-outline-variant/60 bg-surface-container-low p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-primary">{agent.node}</span>
                <Icon className="w-4 h-4 text-on-surface-variant" />
              </div>
              <div className="border-b border-outline-variant/40 pb-3">
                <h3 className="font-sans text-base font-bold text-on-surface">{agent.role}</h3>
              </div>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed flex-1">{agent.description}</p>
              <div className="pt-3 border-t border-outline-variant/40 flex items-center justify-between font-mono text-[10px]">
                <span className="text-on-surface-variant">OUTPUT</span>
                <span className="text-primary font-bold">{agent.output}</span>
              </div>
              {/* Step connector line */}
              {i < AGENTS.length - 1 && (
                <div className="absolute -right-px top-1/2 w-px h-8 bg-primary/30 hidden lg:block" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Zap, title: 'Instant Pipeline Start', description: 'Describe your idea and watch all four agents begin working within seconds.' },
  { icon: CheckCircle2, title: 'Human Approval Gates', description: 'Review and approve each agent output before the pipeline advances to the next phase.' },
  { icon: GitBranch, title: 'Revision Loops', description: 'Request changes at any checkpoint. Agents regenerate with your specific feedback.' },
  { icon: Shield, title: 'Encrypted BYOK Credentials', description: 'API keys stored with AES-256-GCM encryption. Zero-knowledge server-side handling.' },
  { icon: Terminal, title: 'Built-in Code Studio', description: 'Monaco editor, file explorer, and live preview for reviewing generated implementation.' },
  { icon: Layers, title: 'Artifact Registry', description: 'Every generated document, spec, and code artifact is versioned and accessible throughout the build.' },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-12 max-w-7xl mx-auto px-6 md:px-12">
      <div className="mb-6">
        <p className="font-mono text-[11px] font-bold text-primary uppercase tracking-wider mb-1">Platform Capabilities</p>
        <h2 className="font-sans text-2xl md:text-3xl font-bold text-on-surface">Everything for autonomous builds</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="border border-outline-variant/60 bg-surface-container-low p-5 flex flex-col gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-primary/20 bg-primary/5 text-primary">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="font-sans text-sm font-bold text-on-surface">{f.title}</h3>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">{f.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function LandingProof() {
  const stats = [
    { value: '137', label: 'Tests Passing' },
    { value: '10+', label: 'Pipeline Phases' },
    { value: '130+', label: 'API Routes' },
    { value: '4', label: 'AI Agents' },
  ];

  return (
    <section className="py-10 max-w-7xl mx-auto px-6 md:px-12">
      <div className="border border-outline-variant/60 bg-surface-container-low p-6 md:p-8">
        <p className="font-mono text-[11px] font-bold text-primary uppercase tracking-wider mb-6 text-center">Platform Stats</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center border-r border-outline-variant/40 last:border-r-0 px-4">
              <div className="font-sans text-3xl font-bold text-primary">{s.value}</div>
              <div className="font-mono text-[11px] text-on-surface-variant mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-surface-container-lowest w-full mt-auto border-t border-outline-variant/60">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 px-6 md:px-12 py-10 max-w-7xl mx-auto">
        <div className="md:col-span-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-primary/10 border border-primary/30 rounded flex items-center justify-center">
              <Logo size={14} />
            </div>
            <span className="font-mono text-sm font-bold text-on-surface">{APP_NAME}</span>
          </div>
          <span className="font-mono text-[11px] text-on-surface-variant">
            Autonomous AI Software Engineering Platform
          </span>
          <span className="font-mono text-[10px] text-on-surface-variant/50 mt-1">
            © 2026 HibirDev AI
          </span>
        </div>

        <div className="md:col-span-4 flex flex-wrap gap-x-8 gap-y-3 justify-start md:justify-end items-start font-mono text-xs">
          {[
            { label: 'Dashboard', href: ROUTES.dashboard },
            { label: 'Sign In', href: ROUTES.login },
            { label: 'Start Building', href: ROUTES.register },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="text-on-surface-variant hover:text-primary transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
