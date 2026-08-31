'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Code2,
  FolderTree,
  Layers,
  RefreshCw,
  Hourglass,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { cn } from '@/lib/utils';
import { APP_NAME, ROUTES } from '@/config/constants';
import { useTheme } from 'next-themes';

/**
 * Responsive Top Navigation Bar matching Blueprint Design.
 */
export function LandingHeader() {
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-white/10 transition-all">
      <div className="flex justify-between items-center px-6 md:px-12 py-4 max-w-7xl mx-auto">
        {/* Logo & Title */}
        <Link href={ROUTES.home} className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-primary/40 text-primary shadow-[0_0_12px_rgba(0,242,254,0.25)] group-hover:scale-105 transition-transform">
            <Logo size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-heading">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 font-sans text-sm font-medium">
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#product">
            Product
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#how-it-works">
            How It Works
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#agents">
            Agents
          </a>
          <Link className="text-on-surface-variant hover:text-primary transition-colors" href={ROUTES.dashboard}>
            Workspace
          </Link>
        </div>

        {/* Action Controls & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-white/10 hover:border-primary text-on-surface-variant hover:text-white transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>
          )}

          <Link href={ROUTES.login} className="hidden sm:inline-block">
            <button className="text-on-surface-variant hover:text-primary font-mono text-xs font-bold px-4 py-2 transition-colors">
              Sign In
            </button>
          </Link>

          <Link href={ROUTES.register}>
            <button className="bg-primary text-background font-mono text-xs font-bold px-5 py-2.5 border border-primary hover:bg-transparent hover:text-primary transition-all duration-200 uppercase tracking-wider glow-cyan">
              Start Building
            </button>
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-on-surface-variant hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-surface p-6 space-y-4 font-mono text-xs">
          <a
            href="#product"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-on-surface-variant hover:text-white py-2"
          >
            Product
          </a>
          <a
            href="#how-it-works"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-on-surface-variant hover:text-white py-2"
          >
            How It Works
          </a>
          <a
            href="#agents"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-on-surface-variant hover:text-white py-2"
          >
            Agents
          </a>
          <Link
            href={ROUTES.dashboard}
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-on-surface-variant hover:text-white py-2"
          >
            Workspace
          </Link>
          <div className="pt-2 border-t border-white/10 flex justify-between items-center">
            <Link href={ROUTES.login} onClick={() => setIsMobileMenuOpen(false)}>
              <span className="text-primary font-bold">Sign In</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/**
 * Blueprint Hero Section.
 */
export function LandingHero() {
  return (
    <section id="product" className="pt-32 pb-16 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 blueprint-border p-6 md:p-12 bg-surface relative overflow-hidden glass-card">
        {/* Content Column */}
        <div className="lg:col-span-6 flex flex-col justify-center gap-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-primary/40 bg-primary/10 text-primary font-mono text-xs font-bold uppercase tracking-wider w-fit rounded-full">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Autonomous AI Enterprise v2.4
          </div>

          <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-white leading-tight">
            Build Software With an <span className="text-primary font-bold">AI Team.</span>
          </h1>

          <p className="font-sans text-sm md:text-base text-on-surface-variant max-w-lg leading-relaxed">
            HibirDev AI turns your software idea into product requirements, technical architecture, user experience, and implementation through four specialized AI agents.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <Link href={ROUTES.register}>
              <button className="bg-primary text-background font-mono text-xs font-bold py-3.5 px-6 border border-primary hover:bg-transparent hover:text-primary transition-all duration-200 uppercase tracking-wider flex items-center gap-2 offset-shadow">
                <span>Start Building</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <a href="#how-it-works">
              <button className="bg-surface-container-high border border-white/10 hover:border-primary text-white font-mono text-xs font-bold py-3.5 px-6 transition-all uppercase tracking-wider">
                Explore Workflow
              </button>
            </a>
          </div>
        </div>

        {/* Visual Live Agent Status Simulation */}
        <div className="lg:col-span-6 relative bg-background border border-white/10 rounded-xl p-4 md:p-6 flex flex-col justify-between">
          <div className="font-mono text-xs font-bold text-on-surface-variant mb-4 flex justify-between items-center border-b border-white/10 pb-3">
            <span>PROJECT_ID: STUDYMATE</span>
            <span className="text-primary font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              STATUS: COMPILING
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* CEO Agent */}
            <div className="flex items-center justify-between p-3 border border-white/10 bg-surface rounded-lg">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-success" />
                <span className="text-white font-bold">CEO_AGENT</span>
              </div>
              <span className="text-success font-bold">[DONE]</span>
            </div>

            {/* Architect Agent */}
            <div className="flex items-center justify-between p-3 border border-white/10 bg-surface rounded-lg">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-success" />
                <span className="text-white font-bold">ARCHITECT_AGENT</span>
              </div>
              <span className="text-success font-bold">[DONE]</span>
            </div>

            {/* Designer Agent */}
            <div className="flex items-center justify-between p-3 border border-primary bg-primary/10 rounded-lg glow-border">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                <span className="text-primary font-bold">DESIGNER_AGENT</span>
              </div>
              <span className="text-primary font-bold">[ACTIVE]</span>
            </div>

            {/* Developer Agent */}
            <div className="flex items-center justify-between p-3 border border-white/10 bg-surface/50 opacity-60 rounded-lg">
              <div className="flex items-center gap-2.5">
                <Hourglass className="w-4 h-4 text-on-surface-variant" />
                <span className="text-on-surface-variant">DEVELOPER_AGENT</span>
              </div>
              <span className="text-on-surface-variant">[PENDING]</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Workflow Spine Section.
 */
export function LandingSocialProof() {
  return (
    <section id="how-it-works" className="py-12 max-w-7xl mx-auto px-6 md:px-12">
      <div className="border-t border-b border-white/10 py-8">
        <p className="font-mono text-xs font-bold text-on-surface-variant mb-6 uppercase tracking-widest text-center md:text-left">
          Autonomous Orchestration Spine
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs font-bold text-on-surface-variant">
          <span className="text-primary">IDEA</span>
          <div className="h-px flex-1 min-w-[30px] bg-white/10 relative">
            <div className="absolute left-0 top-0 h-full bg-primary w-full" />
          </div>
          <span className="text-primary">PRODUCT</span>
          <div className="h-px flex-1 min-w-[30px] bg-white/10 relative">
            <div className="absolute left-0 top-0 h-full bg-primary w-1/2" />
          </div>
          <span className="text-white">ARCHITECTURE</span>
          <div className="h-px flex-1 min-w-[30px] bg-white/10 relative">
            <div className="absolute left-0 top-0 h-full bg-white/20 w-0" />
          </div>
          <span className="text-on-surface-variant">DESIGN</span>
          <div className="h-px flex-1 min-w-[30px] bg-white/10 relative">
            <div className="absolute left-0 top-0 h-full bg-white/20 w-0" />
          </div>
          <span className="text-on-surface-variant">CODE</span>
        </div>
      </div>
    </section>
  );
}

/**
 * AI Roster Departments Section.
 */
export function LandingDepartments() {
  const AGENTS = [
    {
      role: 'CEO_AGENT',
      title: 'Product & Scope',
      status: 'ACTIVE',
      focus: 'Analyzes user prompts, defines product specs, writes requirements, and locks scope.',
      icon: Bot,
    },
    {
      role: 'ARCHITECT_AGENT',
      title: 'System Blueprint',
      status: 'ACTIVE',
      focus: 'Selects tech stacks (Next.js, Prisma, PostgreSQL), models DB schemas, and designs topology.',
      icon: Layers,
    },
    {
      role: 'DESIGNER_AGENT',
      title: 'UI/UX Engineering',
      status: 'ACTIVE',
      focus: 'Generates responsive design systems, color tokens, layout containers, and components.',
      icon: Sparkles,
    },
    {
      role: 'DEVELOPER_AGENT',
      title: 'Full-Stack Execution',
      status: 'ACTIVE',
      focus: 'Writes clean TypeScript code, handles API integration, runs builds, and deploys.',
      icon: Code2,
    },
  ];

  return (
    <section id="agents" className="py-16 max-w-7xl mx-auto px-6 md:px-12">
      <div className="mb-12">
        <h2 className="font-heading text-3xl font-bold text-white mb-3">
          Specialized Autonomous AI Agents
        </h2>
        <p className="font-sans text-sm text-on-surface-variant max-w-2xl leading-relaxed">
          Four synchronized AI agents operating as an integrated engineering department.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.role}
              className="border border-white/10 bg-surface p-6 rounded-2xl flex flex-col justify-between hover:border-primary transition-all duration-300 glass-card offset-shadow"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-primary/30 flex items-center justify-center text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[9px] font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 uppercase tracking-wider rounded-full">
                    {agent.status}
                  </span>
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-1">{agent.title}</h3>
                <p className="font-mono text-xs text-primary font-bold mb-3">{agent.role}</p>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  {agent.focus}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Pipeline Section.
 */
export function LandingPipeline() {
  return (
    <section className="py-16 max-w-7xl mx-auto px-6 md:px-12">
      <div className="border border-white/10 bg-surface p-8 rounded-2xl glass-card">
        <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-widest mb-6">
          5-Stage Autonomous Execution Pipeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 font-mono text-xs">
          <div className="p-4 border border-white/10 bg-background rounded-xl">
            <span className="text-primary font-bold block mb-1">01. SCOPE</span>
            <p className="text-[11px] text-on-surface-variant">Write specification requirements.</p>
          </div>
          <div className="p-4 border border-white/10 bg-background rounded-xl">
            <span className="text-primary font-bold block mb-1">02. ARCH</span>
            <p className="text-[11px] text-on-surface-variant">Design DB schema & topology.</p>
          </div>
          <div className="p-4 border border-primary bg-primary/10 rounded-xl glow-border">
            <span className="text-primary font-bold block mb-1">03. DESIGN</span>
            <p className="text-[11px] text-on-surface-variant">Incorporate responsive tokens.</p>
          </div>
          <div className="p-4 border border-white/10 bg-background rounded-xl">
            <span className="text-white font-bold block mb-1">04. CODE</span>
            <p className="text-[11px] text-on-surface-variant">Stream live code generation.</p>
          </div>
          <div className="p-4 border border-white/10 bg-background rounded-xl">
            <span className="text-white font-bold block mb-1">05. DEPLOY</span>
            <p className="text-[11px] text-on-surface-variant">Compile live preview sandbox.</p>
          </div>
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
    <section className="py-20 px-6 md:px-12 max-w-5xl mx-auto text-center">
      <div className="bg-surface p-8 md:p-14 border border-primary/40 rounded-2xl glass-card offset-shadow relative overflow-hidden">
        <h2 className="font-heading text-2xl md:text-4xl font-bold text-white mb-6 leading-tight max-w-2xl mx-auto">
          Start Building With Your Autonomous AI Team Today.
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
          <input
            className="bg-background font-mono text-xs text-white border border-white/20 px-4 py-3.5 flex-grow focus:outline-none focus:border-primary rounded-xl placeholder:text-on-surface-variant/40"
            placeholder="Describe your app idea (e.g. AI CRM platform...)"
            type="text"
          />
          <Link href={ROUTES.register}>
            <button className="w-full sm:w-auto bg-primary text-background font-mono text-xs font-bold px-6 py-3.5 border border-primary hover:bg-transparent hover:text-primary transition-all duration-200 uppercase tracking-wider rounded-xl">
              Generate Scope
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Footer matching Blueprint Design.
 */
export function LandingFooter() {
  return (
    <footer className="bg-background text-on-surface-variant font-mono text-xs border-t border-white/10 w-full mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 px-6 md:px-12 py-12 max-w-7xl mx-auto">
        <div className="md:col-span-2 flex flex-col gap-2">
          <span className="font-heading text-lg font-bold text-white">{APP_NAME}</span>
          <span className="text-on-surface-variant opacity-80">
            © 2026 HibirDev AI. Engineering Excellence.
          </span>
        </div>

        <div className="md:col-span-4 flex flex-wrap gap-6 justify-start md:justify-end items-center">
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#product">
            Product
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#how-it-works">
            How It Works
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#agents">
            Agents
          </a>
          <Link className="text-on-surface-variant hover:text-primary transition-colors" href={ROUTES.dashboard}>
            Workspace
          </Link>
        </div>
      </div>
    </footer>
  );
}
