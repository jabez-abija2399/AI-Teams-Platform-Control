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
} from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { cn } from '@/lib/utils';
import { APP_NAME, ROUTES } from '@/config/constants';

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
 * Sticky Header Navbar with Brutalist styling.
 */
export function LandingHeader() {
  return (
    <header className="bg-background dark:bg-background text-primary dark:text-primary font-body-md text-body-md font-bold text-on-background tracking-tighter w-full top-0 sticky border-b border-[rgba(223,222,220,0.1)] z-50">
      <div className="flex justify-between items-center px-gutter h-16 w-full max-w-full">
        <Link href={ROUTES.home} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container border border-white/10 text-primary">
            <Logo size={20} />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">{APP_NAME}</span>
        </Link>
        <nav className="hidden md:flex gap-8">
          <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors duration-200 px-3 py-2 text-sm" href="#company">
            Organization
          </a>
          <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors duration-200 px-3 py-2 text-sm" href="#workspace">
            Workspace
          </a>
          <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors duration-200 px-3 py-2 text-sm" href="#features">
            Processes
          </a>
          <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors duration-200 px-3 py-2 text-sm" href="#pricing">
            Pricing
          </a>
        </nav>
        <Link href={ROUTES.register}>
          <button className="bg-[#00ACAC] text-background font-mono text-[11px] font-bold px-6 py-2 border border-[#00ACAC] hover:bg-transparent hover:text-[#00ACAC] transition-colors duration-200 active:translate-y-0.5 transition-transform uppercase tracking-wider">
            Start Building
          </button>
        </Link>
      </div>
    </header>
  );
}

/**
 * Asymmetrical Brutalist Hero Section.
 */
export function LandingHero() {
  return (
    <section className="px-gutter py-24 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-5 flex flex-col gap-8">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface leading-tight">
            Deploy an entire autonomous AI company to build your software.
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-on-surface-variant">
            Stop managing freelancers. Orchestrate intelligent agents that design, architect, and code your ideas into reality.
          </p>
          <div>
            <Link href={ROUTES.register}>
              <button className="bg-[#00ACAC] text-background font-mono text-xs font-bold px-8 py-4 border border-[#00ACAC] hover:bg-transparent hover:text-[#00ACAC] transition-all duration-200 offset-shadow uppercase tracking-wider">
                Launch AI Company
              </button>
            </Link>
          </div>
        </div>
        <div className="md:col-span-7 relative">
          <div className="glass-panel p-6 rounded-none relative z-10 offset-shadow bg-surface-container/70 backdrop-blur-md border border-white/10">
            <div className="flex items-center justify-between border-b border-[rgba(223,222,220,0.1)] pb-4 mb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
                <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
                <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
              </div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Live Telemetry Workspace
              </span>
              <Terminal className="w-4 h-4 text-on-surface-variant" />
            </div>
            <div className="h-64 flex items-center justify-center border border-[rgba(223,222,220,0.1)] bg-surface-container-low relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center opacity-50">
                <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 150 Q 150 50, 250 150 T 450 150" fill="transparent" stroke="#00ACAC" strokeWidth="2"></path>
                  <circle cx="50" cy="150" fill="#00ACAC" r="4"></circle>
                  <circle cx="250" cy="150" fill="#00ACAC" r="6"></circle>
                  <circle cx="450" cy="150" fill="#00ACAC" r="4"></circle>
                </svg>
              </div>
              <div className="text-center z-10">
                <span className="font-mono text-sm text-primary font-bold block mb-2">Analyzing Architecture...</span>
                <div className="w-48 h-1 bg-surface-container-highest mx-auto">
                  <div className="h-full bg-primary w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative background grid */}
          <div className="absolute -inset-4 border border-[rgba(223,222,220,0.05)] bg-[rgba(255,255,255,0.01)] z-0 -translate-x-4 translate-y-4"></div>
        </div>
      </div>
    </section>
  );
}

/**
 * Social Proof Section.
 */
export function LandingCompany() {
  return (
    <section className="border-y border-[rgba(223,222,220,0.1)] py-12 bg-surface-container-lowest">
      <div className="max-w-7xl mx-auto px-gutter text-center">
        <p className="font-mono text-[11px] font-bold text-on-surface-variant mb-8 uppercase tracking-widest">
          Trusted by engineering teams worldwide
        </p>
        <div className="flex flex-wrap justify-center gap-16 opacity-50 grayscale">
          {TRUST.map((name) => (
            <span key={name} className="font-heading text-lg font-bold text-[#A6A7A2]">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * AI Roster Departments Section.
 */
export function LandingShowcase() {
  return (
    <section id="company" className="py-24 px-gutter max-w-7xl mx-auto">
      <div className="mb-12">
        <h2 className="font-heading text-3xl font-bold text-on-surface mb-4">AI Roster Departments</h2>
        <p className="text-sm text-on-surface-variant max-w-2xl">
          Specialized autonomous agents ready to tackle your complex engineering challenges.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TEAM.map((member) => {
          const Icon = member.icon;
          return (
            <div key={member.role} className="border border-[rgba(223,222,220,0.1)] bg-[#464545] p-6 hover:translate-y-[-4px] transition-transform duration-300 relative group">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-5 h-5 text-primary" />
              </div>
              <div className="mb-6 flex justify-between items-start">
                <div className="w-12 h-12 bg-surface-container-high border border-[rgba(223,222,220,0.1)] flex items-center justify-center">
                  <Icon className="w-6 h-6 text-on-surface" />
                </div>
                <span className="bg-primary text-background font-mono text-[10px] font-bold px-2 py-1 uppercase">
                  {member.status}
                </span>
              </div>
              <h3 className="font-heading text-lg font-bold text-on-surface mb-1">{member.title}</h3>
              <p className="font-mono text-xs text-on-surface-variant mb-4">{member.role}</p>
              <p className="text-sm text-[#c9c6c5] border-t border-[rgba(223,222,220,0.1)] pt-4 mt-4 leading-relaxed">
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
 * Pipeline Steps Section.
 */
export function LandingFeatures() {
  const pipeline = ['Ideate', 'Spec', 'Build', 'Test', 'Deploy'];
  return (
    <section id="features" className="py-12 border-y border-[rgba(223,222,220,0.1)] bg-surface-container-low overflow-hidden">
      <div className="max-w-7xl mx-auto px-gutter">
        <p className="font-mono text-[11px] font-bold text-on-surface-variant mb-8 uppercase tracking-wider">
          Orchestration Pipeline
        </p>
        <div className="flex items-center justify-between relative px-4">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-[rgba(223,222,220,0.1)] -z-10 transform -translate-y-1/2" />
          
          {pipeline.map((step, idx) => {
            const isBuild = step === 'Build';
            return (
              <div key={step} className="flex flex-col items-center gap-2 relative">
                {isBuild ? (
                  <div className="w-6 h-6 bg-[#00ACAC] shadow-[0_0_15px_rgba(0,172,172,0.5)] rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-background rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-4 h-4 bg-surface-container-highest border border-[rgba(223,222,220,0.5)] rounded-full"></div>
                )}
                <span className={cn(
                  "font-mono text-[10px]",
                  isBuild ? "text-primary font-bold text-xs" : "text-on-surface-variant opacity-70"
                )}>
                  {step}
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
 * Placeholder for compatibility / layout mapping.
 */
export function LandingHowItWorks() {
  return null;
}

/**
 * Core CTA Banner with idea description input.
 */
export function LandingCta() {
  return (
    <section id="workspace" className="py-24 px-gutter max-w-5xl mx-auto text-center">
      <div className="bg-[#464545] p-12 md:p-24 border border-[rgba(223,222,220,0.1)] offset-shadow">
        <h2 className="font-heading text-3xl font-bold text-on-surface mb-8 max-w-2xl mx-auto leading-snug">
          Stop managing freelancers. Let AI agents write your software.
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
          <input
            className="bg-surface font-mono text-sm text-on-surface border border-[rgba(223,222,220,0.2)] px-4 py-3 flex-grow focus:outline-none focus:border-[#00ACAC] focus:ring-1 focus:ring-[#00ACAC] placeholder-on-surface-variant/40"
            placeholder="Describe your app idea..."
            type="text"
          />
          <Link href={ROUTES.register}>
            <button className="w-full sm:w-auto bg-[#00ACAC] text-background font-mono text-[11px] font-bold px-8 py-4 border border-[#00ACAC] hover:bg-transparent hover:text-[#00ACAC] transition-colors duration-200 uppercase whitespace-nowrap tracking-wider">
              Generate Scope
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * System Footer with Live Status Telemetry.
 */
export function LandingFooter() {
  return (
    <footer className="bg-background dark:bg-background text-primary dark:text-primary font-mono text-xs text-on-background w-full relative border-t border-[rgba(223,222,220,0.1)]">
      <div className="flex flex-col md:flex-row justify-between items-center px-gutter py-8 w-full gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <span className="text-on-surface-variant font-mono">© {new Date().getFullYear()} HibirDev AI Orchestration</span>
        </div>
        <div className="flex items-center gap-2 border border-[rgba(223,222,220,0.1)] bg-surface-container-low px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-[#00ACAC] animate-pulse"></div>
          <span className="font-mono text-[12px] text-on-surface-variant">
            All AI Agent Clusters Operational - Node Latency: 22ms
          </span>
        </div>
        <nav className="flex gap-6">
          {FOOTER_LINKS.map((link) => (
            <a key={link.label} className="text-on-surface-variant hover:text-primary transition-colors font-mono" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
