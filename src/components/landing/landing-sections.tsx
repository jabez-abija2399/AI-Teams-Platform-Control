'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  FolderTree,
  Layers,
  Rocket,
  Shield,
  Sparkles,
  Terminal,
  Cpu,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME, ROUTES } from '@/config/constants';
import { MissionControlPreview } from '@/components/shared/mission-control-preview';
import { GlassCard, NeonButton, StatusBadge } from '@/packages/ui';

const SHOWCASE_PANES = [
  { id: 'mission', label: 'Mission Control', icon: Rocket },
  { id: 'studio', label: 'Workspace IDE', icon: Code2 },
  { id: 'explorer', label: 'Explorer', icon: FolderTree },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
] as const;

const TRUST = ['Enterprise Ready', 'Production Code', 'AES-256 Secure', 'Human Approval Gates'] as const;

const TEAM = [
  { role: 'Sarah', title: 'Product Manager', dept: 'Strategy & Requirements', focus: 'PRDs, User Stories, Acceptance Criteria' },
  { role: 'Marcus', title: 'System Architect', dept: 'System Architecture', focus: 'Tech Stacks, Schema Design, API Specs' },
  { role: 'Elena', title: 'UI/UX Designer', dept: 'Interface Design', focus: 'Design Tokens, Component Mapping, UX Flow' },
  { role: 'Alex', title: 'Lead Developer', dept: 'Software Engineering', focus: 'Frontend, Backend, Database Implementation' },
  { role: 'Maya', title: 'QA & Security Lead', dept: 'Verification & QA', focus: 'Automated Test Suites, Security Audit' },
] as const;

const FEATURES = [
  {
    icon: Bot,
    title: 'Autonomous AI Organization',
    description:
      'Specialized AI employees collaborate like a real engineering org — not a single chatbot answering prompts.',
  },
  {
    icon: Layers,
    title: 'End-to-End Execution Pipeline',
    description:
      'Discovery through architecture, development, testing, security, and deployment — fully orchestrated.',
  },
  {
    icon: Shield,
    title: 'Human Governance & Approvals',
    description:
      'Stay in control with checkpoints at product, design, architecture, and deployment milestones.',
  },
  {
    icon: Rocket,
    title: 'Real-Time Mission Control',
    description:
      'Watch your AI team work in real time — live code generation, phase timelines, artifacts, and Monaco IDE.',
  },
] as const;

const STEPS = [
  {
    step: '01',
    title: 'Define Software Vision',
    detail: 'Describe what you want to build once with prompt templates.',
  },
  {
    step: '02',
    title: 'Review Architecture Specs',
    detail: 'Product specs, tech stacks, and DB schemas land at your desk.',
  },
  {
    step: '03',
    title: 'AI Company Builds',
    detail: 'Architects, engineers, designers, and QA collaborate autonomously.',
  },
  {
    step: '04',
    title: 'Ship to Production',
    detail: 'Receive working software with live sandbox preview and Git sync.',
  },
] as const;

const FOOTER_LINKS = [
  { href: '#company', label: 'AI Organization' },
  { href: '#workspace', label: 'Workspace' },
  { href: '#features', label: 'Capabilities' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: ROUTES.login, label: 'Sign In' },
  { href: ROUTES.register, label: 'Initialize Company' },
] as const;

/**
 * Ultra-Modern Cyber Void Sticky Header Navbar.
 */
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-surface-glass/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={ROUTES.home} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-black">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">{APP_NAME}</span>
        </Link>
        <nav className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-wider text-foreground/70 md:flex">
          <a href="#company" className="transition-colors hover:text-primary">
            Organization
          </a>
          <a href="#workspace" className="transition-colors hover:text-primary">
            Workspace
          </a>
          <a href="#features" className="transition-colors hover:text-primary">
            Features
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-primary">
            Process
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href={ROUTES.login} className="text-xs font-bold text-foreground/75 hover:text-primary transition-colors px-3 py-2">
            Sign In
          </Link>
          <Link href={ROUTES.register}>
            <NeonButton variant="primary" className="h-9 px-4 text-xs font-bold shadow-md">
              <span>Start Building</span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </NeonButton>
          </Link>
        </div>
      </div>
    </header>
  );
}

/**
 * Atmospheric Cyber Void Hero Section.
 */
export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32">
      {/* Background Cyber Ambient Radials */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(0,172,172,0.15),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,172,172,0.08),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading and description */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-tight text-balance">
              Build software with an entire autonomous AI company.
            </h1>
            <p className="mt-6 text-base leading-relaxed text-secondary sm:text-lg max-w-xl">
              Describe your vision once. Product managers, system architects, designers, developers, and QA specialists collaborate in real time to ship production applications.
            </p>

            {/* Call to Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href={ROUTES.register} className="w-full sm:w-auto">
                <NeonButton variant="primary" className="w-full sm:w-auto px-8 h-12 text-sm font-bold">
                  <span>Launch AI Company</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </NeonButton>
              </Link>
              <Link href={ROUTES.login} className="w-full sm:w-auto">
                <NeonButton variant="secondary" className="w-full sm:w-auto px-8 h-12 text-sm font-bold">
                  Sign In to Workspace
                </NeonButton>
              </Link>
            </div>

            {/* Quick Inspiration Tags */}
            <div className="mt-8 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-secondary font-mono text-[11px] uppercase tracking-wider mr-1">Inspiration:</span>
              {['SaaS Kanban Platform', 'Realtime Chat Hub', 'AI Billing Portal', 'Landing Page'].map(
                (tag) => (
                  <Link
                    key={tag}
                    href={`${ROUTES.projects}/new`}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/10 transition-all"
                  >
                    ✨ {tag}
                  </Link>
                ),
              )}
            </div>

            {/* Trust Badges */}
            <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-secondary font-mono">
              {TRUST.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Mission Control Preview */}
          <div className="lg:col-span-5 w-full relative flex justify-center">
            <div className="relative w-full shadow-[0_0_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden border border-white/10">
              <GlassCard className="p-0 border-none bg-surface-glass/95">
                <MissionControlPreview />
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * AI Company Organization Section.
 */
export function LandingCompany() {
  return (
    <section id="company" className="border-t border-white/10 py-24 bg-white/[0.01]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Meet Your Autonomous AI Workforce
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/60 leading-relaxed">
            Specialized engineering roles that collaborate the way elite software teams do — with you in the driver&apos;s seat.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {TEAM.map((member) => (
            <GlassCard
              key={member.role}
              interactive={true}
              className="p-5 border-white/10 hover:border-primary/40 transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30 font-bold text-sm">
                  {member.role[0]}
                </div>
                <StatusBadge status="HEALTHY" />
              </div>
              <h3 className="mt-4 text-base font-bold tracking-tight text-white">{member.role}</h3>
              <p className="text-xs font-semibold text-primary">{member.title}</p>
              <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-white/40">
                {member.dept}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-white/60 line-clamp-2">{member.focus}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Interactive Studio Workspace Showcase.
 */
export function LandingShowcase() {
  return (
    <section id="workspace" className="border-t border-white/10 py-24 bg-void">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            One Unified Workspace for the Entire Company
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/60 leading-relaxed">
            Mission Control, Monaco IDE, SVG Pipeline Visualizer, and Live Sandbox Preview in a single surface.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {SHOWCASE_PANES.map(({ id, label, icon: Icon }) => (
            <span
              key={id}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-mono font-semibold text-white/70"
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              {label}
            </span>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-surface-glass/90 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-5 py-3.5">
            <span className="h-3 w-3 rounded-full bg-danger/80" />
            <span className="h-3 w-3 rounded-full bg-warning/80" />
            <span className="h-3 w-3 rounded-full bg-success/80" />
            <span className="ml-3 text-xs font-bold text-white font-mono">Cyber Void Studio · Project Workspace</span>
            <span className="ml-auto hidden text-[11px] font-mono text-white/40 sm:inline">
              Monaco · TypeScript · Real-Time Stream
            </span>
          </div>

          <div className="grid min-h-[340px] lg:grid-cols-[220px_1fr_240px]">
            <aside className="hidden border-r border-white/10 p-5 lg:block bg-white/[0.01]">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40">
                Explorer
              </p>
              <ul className="mt-3 space-y-1.5 font-mono text-xs text-white/60">
                <li className="rounded-lg bg-primary/20 px-2.5 py-1.5 font-bold text-primary">src/</li>
                <li className="px-2.5 py-1 pl-6">app/page.tsx</li>
                <li className="px-2.5 py-1 pl-6">components/</li>
                <li className="px-2.5 py-1 pl-6">packages/ui/</li>
                <li className="rounded-lg px-2.5 py-1.5 text-white/40">schema.prisma</li>
                <li className="rounded-lg px-2.5 py-1.5 text-white/40">README.md</li>
              </ul>
            </aside>

            <div className="flex flex-col border-b border-white/10 lg:border-b-0 lg:border-r bg-[#05050A]">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-xs text-white/50 bg-white/[0.02]">
                <span className="rounded-md bg-primary/20 px-2.5 py-0.5 font-mono font-bold text-primary">page.tsx</span>
                <span className="font-mono text-white/40">pipeline.ts</span>
              </div>
              <pre className="flex-1 overflow-hidden p-5 font-mono text-xs leading-6 text-white/70">
                <code>
                  <span className="text-white/40">{'// Generated by Alex (Lead Developer)'}</span>
                  {'\n'}
                  <span className="text-primary">{'export default function '}</span>
                  <span className="text-success">{'AIWorkspace'}</span>
                  <span className="text-white">{'() {'}</span>
                  {'\n'}
                  {'  '}
                  <span className="text-primary">{'return ('}</span>
                  {'\n'}
                  {'    '}
                  <span className="text-secondary">{'<CommandCenter>'}</span>
                  {'\n'}
                  {'      '}
                  <span className="text-white">{'<PipelineVisualizer live={true} />'}</span>
                  {'\n'}
                  {'      '}
                  <span className="text-white">{'<AgentRoster specialists={5} />'}</span>
                  {'\n'}
                  {'    '}
                  <span className="text-secondary">{'</CommandCenter>'}</span>
                  {'\n'}
                  {'  );'}
                  {'\n'}
                  <span className="text-white">{'}'}</span>
                </code>
              </pre>
              <div className="border-t border-white/10 bg-white/[0.02] px-5 py-2.5 font-mono text-[11px] text-white/50 flex items-center justify-between">
                <span className="text-success font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Live Sync · Compilation Clean
                </span>
                <span className="text-white/30">TypeScript 5.x</span>
              </div>
            </div>

            <aside className="space-y-5 p-5 bg-white/[0.01]">
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40">
                  Telemetry Feed
                </p>
                <ul className="mt-3 space-y-3 text-left text-xs">
                  <li className="flex gap-2.5 text-white font-medium">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse" />
                    Marcus updated system architecture
                  </li>
                  <li className="flex gap-2.5 text-white/60">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />
                    Sarah refined PRD user acceptance
                  </li>
                  <li className="flex gap-2.5 text-white/60">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />
                    Sandbox preview synced to Studio
                  </li>
                </ul>
              </div>
              <GlassCard className="p-3.5 border-white/10 bg-white/5">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40">Pipeline Progress</p>
                <p className="mt-1 text-xs font-bold text-white">Full Build · 80%</p>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[80%] rounded-full bg-gradient-to-r from-primary to-success shadow-[0_0_8px_#6366f1]" />
                </div>
              </GlassCard>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Cyber Void Core Capabilities Grid.
 */
export function LandingFeatures() {
  return (
    <section id="features" className="border-t border-white/10 py-24 bg-white/[0.01]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built Like an Engineering Organization
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/60 leading-relaxed">
            Structure, contracts, human governance, and CI/CD pipelines — what you need to trust AI-generated software.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <GlassCard
              key={title}
              interactive={true}
              className="p-8 border-white/10 hover:border-primary/40 transition-all duration-300 shadow-xl"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 4-Step Process Timeline.
 */
export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-white/10 py-24 bg-void">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            From Software Vision to Production
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/60 leading-relaxed">
            A linear lifecycle with you in control — autonomous agents execute the heavy engineering between approval gates.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ step, title, detail }) => (
            <GlassCard
              key={step}
              className="p-6 border-white/10 relative overflow-hidden"
            >
              <span className="font-mono text-3xl font-bold text-primary/30">{step}</span>
              <h3 className="mt-3 text-sm font-bold text-white tracking-tight">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">{detail}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Call to Action Finale Banner.
 */
export function LandingCta() {
  return (
    <section className="border-t border-white/10 py-20 bg-void">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <GlassCard className="p-10 sm:p-16 text-center border-primary/30 bg-gradient-to-br from-surface-glass/90 via-primary/10 to-secondary/10 shadow-2xl relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
          
          <h2 className="relative text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Ready to build with an autonomous AI company?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-sm sm:text-base text-white/70 leading-relaxed">
            Stop coordinating fragmented tools. Start shipping full-stack production software today.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={ROUTES.register} className="w-full sm:w-auto">
              <NeonButton variant="primary" className="w-full sm:w-auto px-8 h-12 text-sm font-bold shadow-xl">
                <span>Start Building Now</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </NeonButton>
            </Link>
            <Link href={ROUTES.login} className="w-full sm:w-auto">
              <NeonButton variant="secondary" className="w-full sm:w-auto px-8 h-12 text-sm font-bold">
                Sign In to Mission Control
              </NeonButton>
            </Link>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}

/**
 * Minimalist Cyber Void Footer with Live Telemetry.
 */
export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 py-12 bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/40">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">{APP_NAME}</span>
          <div className="h-3.5 w-px bg-white/10 ml-2" />
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-primary ml-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            All AI Agents Operational
          </div>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-secondary">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs font-mono text-secondary">
          &copy; {new Date().getFullYear()} {APP_NAME} · Autonomous AI Platform
        </p>
      </div>
    </footer>
  );
}
