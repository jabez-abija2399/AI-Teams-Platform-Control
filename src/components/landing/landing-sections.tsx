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
  Terminal,
  Cpu,
  Zap,
  Search,
  ArrowUpRight,
  Check,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { cn } from '@/lib/utils';
import { APP_NAME, ROUTES } from '@/config/constants';
import { CyberShader } from '@/components/ui/cyber-shader';

const TRUST = ['VERCEL', 'STRIPE', 'SUPABASE'] as const;

const TEAM = [
  {
    role: 'Sarah PM',
    title: 'Product Dept',
    status: 'Active',
    icon: Bot,
    focus: 'Defines scope, writes requirements, and ensures alignment with business goals.',
  },
  {
    role: 'Marcus Architect',
    title: 'Architecture Dept',
    status: 'Active',
    icon: Layers,
    focus: 'Designs scalable systems, selects tech stacks, and plans database schemas.',
  },
  {
    role: 'Alex Developer',
    title: 'Development Dept',
    status: 'Active',
    icon: Code2,
    focus: 'Writes clean, efficient code, creates tests, and handles deployments.',
  },
] as const;

const FOOTER_LINKS = [
  { href: '#company', label: 'Documentation' },
  { href: '#workspace', label: 'Security' },
  { href: '#features', label: 'API Status' },
  { href: '#how-it-works', label: 'Privacy' },
] as const;

/**
 * Sticky Header Navbar with Glassmorphism and Glowing Cyan Accents.
 */
export function LandingHeader() {
  return (
    <header className="bg-surface-glass backdrop-blur-md text-foreground font-sans w-full top-0 sticky border-b border-white/10 z-50 transition-all">
      <div className="flex justify-between items-center px-6 md:px-12 h-16 w-full max-w-full">
        <Link href={ROUTES.home} className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-primary/40 text-primary shadow-[0_0_12px_rgba(0,242,254,0.25)] group-hover:scale-105 transition-transform">
            <Logo size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors font-heading">
            {APP_NAME}
          </span>
        </Link>
        <nav className="hidden md:flex gap-8">
          <a className="text-on-surface-variant hover:text-primary transition-colors px-3 py-2 text-sm font-medium" href="#company">
            Organization
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors px-3 py-2 text-sm font-medium" href="#workspace">
            Workspace
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors px-3 py-2 text-sm font-medium" href="#features">
            Processes
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors px-3 py-2 text-sm font-medium" href="#pricing">
            Pricing
          </a>
        </nav>
        <Link href={ROUTES.register}>
          <button className="bg-primary text-background font-mono text-xs font-bold px-6 py-2.5 border border-primary hover:bg-transparent hover:text-primary transition-all duration-200 uppercase tracking-wider offset-shadow flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Start Building</span>
          </button>
        </Link>
      </div>
    </header>
  );
}

/**
 * Asymmetrical Hero Section with WebGL Shader Canvas.
 */
export function LandingHero() {
  return (
    <section className="relative px-6 md:px-12 py-24 max-w-7xl mx-auto overflow-hidden">
      <CyberShader className="absolute inset-0 w-full h-full pointer-events-none opacity-40 -z-10" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono text-xs font-bold uppercase tracking-wider w-fit">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Autonomous AI Enterprise v2.4
          </div>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            Deploy an entire <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F2FE] to-[#00ACAC]">autonomous AI company</span> to build your software.
          </h1>
          <p className="font-sans text-base md:text-lg text-on-surface-variant leading-relaxed max-w-xl">
            Stop managing freelancers. Orchestrate intelligent agents that design, architect, code, and test your ideas into production reality.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href={ROUTES.register}>
              <button className="bg-primary text-background font-mono text-xs font-bold px-8 py-4 border border-primary hover:bg-transparent hover:text-primary transition-all duration-200 offset-shadow uppercase tracking-wider flex items-center gap-2">
                <span>Launch AI Company</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <a href="#demo">
              <button className="bg-surface-container border border-white/10 hover:border-primary text-white font-mono text-xs font-bold px-8 py-4 transition-all uppercase tracking-wider">
                Watch Telemetry Demo
              </button>
            </a>
          </div>
        </div>

        <div className="lg:col-span-6 relative">
          <div className="glass-card p-6 relative z-10 offset-shadow border-glow">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-danger/80" />
                <div className="w-3 h-3 rounded-full bg-warning/80" />
                <div className="w-3 h-3 rounded-full bg-success/80" />
              </div>
              <span className="font-mono text-xs text-primary font-bold tracking-wider uppercase">Live Telemetry Workspace</span>
              <Terminal className="w-4 h-4 text-primary" />
            </div>

            <div className="h-64 flex items-center justify-center border border-white/10 bg-background/90 relative overflow-hidden">
              {/* Abstract node chart representation */}
              <div className="absolute inset-0 flex items-center justify-center opacity-70">
                <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 150 Q 150 50, 250 150 T 450 150" fill="transparent" stroke="#00F2FE" strokeWidth="2" strokeDasharray="6 6" className="animate-pulse" />
                  <circle cx="50" cy="150" fill="#00F2FE" r="5" />
                  <circle cx="250" cy="150" fill="#00ACAC" r="7" />
                  <circle cx="450" cy="150" fill="#00F2FE" r="5" />
                </svg>
              </div>

              <div className="text-center z-10 space-y-3">
                <span className="font-mono text-xs text-primary font-bold block tracking-widest uppercase">
                  Analyzing Architecture Topology...
                </span>
                <div className="w-56 h-1.5 bg-surface-container mx-auto rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#00F2FE] to-[#00ACAC] w-3/4 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative background grid offset */}
          <div className="absolute -inset-4 border border-primary/20 bg-primary/5 z-0 -translate-x-4 translate-y-4" />
        </div>
      </div>
    </section>
  );
}

/**
 * Social Proof Section.
 */
export function LandingSocialProof() {
  return (
    <section className="border-y border-white/10 py-12 bg-surface-container-lowest">
      <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
        <p className="font-mono text-xs text-on-surface-variant mb-8 uppercase tracking-widest font-bold">
          Trusted by engineering teams worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-70">
          {TRUST.map((name) => (
            <span key={name} className="font-heading text-xl md:text-2xl font-bold tracking-widest text-on-surface-variant hover:text-primary transition-colors">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * AI Roster Departments Grid.
 */
export function LandingDepartments() {
  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="mb-12">
        <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-white mb-4">
          AI Roster Departments
        </h2>
        <p className="font-sans text-base text-on-surface-variant max-w-2xl leading-relaxed">
          Specialized autonomous agents ready to tackle your complex engineering challenges.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TEAM.map((member) => {
          const Icon = member.icon;
          return (
            <div
              key={member.role}
              className="border border-white/10 bg-surface p-8 hover:-translate-y-1.5 transition-all duration-300 relative group offset-shadow hover:border-primary/50"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-5 h-5 text-primary" />
              </div>
              <div className="mb-6 flex justify-between items-start">
                <div className="w-14 h-14 bg-surface-container border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7" />
                </div>
                <span className="bg-primary text-background font-mono text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider">
                  {member.status}
                </span>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-1">{member.title}</h3>
              <p className="font-mono text-xs text-primary font-bold mb-4">{member.role}</p>
              <p className="font-sans text-sm text-on-surface-variant border-t border-white/10 pt-4 mt-4 leading-relaxed">
                {member.focus}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Interactive Orchestration Pipeline Steps.
 */
export function LandingPipeline() {
  return (
    <section className="py-16 border-y border-white/10 bg-surface-container-low overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <p className="font-mono text-xs font-bold text-on-surface-variant mb-10 uppercase tracking-widest">
          Orchestration Pipeline
        </p>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -z-10 transform -translate-y-1/2" />
          {['Ideate', 'Spec', 'Build', 'Test', 'Deploy'].map((stage, idx) => {
            const isActive = stage === 'Build';
            return (
              <div key={stage} className="flex flex-col items-center gap-3">
                {isActive ? (
                  <div className="w-7 h-7 bg-primary glow-cyan rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-background rounded-full" />
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-surface border border-white/20 rounded-full" />
                )}
                <span
                  className={cn(
                    'font-mono text-xs tracking-wider uppercase font-bold',
                    isActive ? 'text-primary' : 'text-on-surface-variant/60',
                  )}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Vision Prompt Scope Input CTA Banner.
 */
export function LandingCTA() {
  return (
    <section className="py-24 px-6 md:px-12 max-w-5xl mx-auto text-center">
      <div className="bg-surface p-10 md:p-16 border border-primary/40 offset-shadow relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-white mb-8 max-w-2xl mx-auto leading-tight">
          Stop managing freelancers. Let AI agents write your software.
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
          <input
            className="bg-background font-mono text-xs text-white border border-white/20 px-4 py-3.5 flex-grow focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50"
            placeholder="Describe your app idea (e.g. Drone delivery SaaS...)"
            type="text"
          />
          <Link href={ROUTES.register}>
            <button className="w-full sm:w-auto bg-primary text-background font-mono text-xs font-bold px-8 py-3.5 border border-primary hover:bg-transparent hover:text-primary transition-all duration-200 uppercase whitespace-nowrap tracking-wider">
              Generate Scope
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * System Status Footer.
 */
export function LandingFooter() {
  return (
    <footer className="bg-background text-on-surface-variant font-mono text-xs border-t border-white/10 w-full relative">
      <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-12 py-8 w-full gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <span>© 2026 {APP_NAME} AI Orchestration</span>
        </div>
        <div className="flex items-center gap-2 border border-white/10 bg-surface px-4 py-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] text-on-surface-variant">
            All AI Clusters Operational — Latency: 18ms
          </span>
        </div>
        <nav className="flex gap-6">
          {FOOTER_LINKS.map((link) => (
            <a key={link.label} className="hover:text-primary transition-colors" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
