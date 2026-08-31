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
} from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { APP_NAME, ROUTES } from '@/config/constants';
import { useTheme } from 'next-themes';

/**
 * Top Navigation Bar - Matches User Specification.
 */
export function LandingHeader() {
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background border-b border-white/10 transition-all">
      <div className="flex justify-between items-center px-6 md:px-12 py-4 max-w-7xl mx-auto">
        {/* Logo & Title */}
        <Link href={ROUTES.home} className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-primary/40 text-primary">
            <Logo size={20} />
          </div>
          <span className="font-heading text-lg font-bold text-primary">
            {APP_NAME}
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 font-sans text-sm font-medium">
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
            Product
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#workflow">
            How It Works
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#agents">
            Agents
          </a>
          <Link className="text-on-surface-variant hover:text-primary transition-colors" href={ROUTES.dashboard}>
            Workspace
          </Link>
        </div>

        {/* Action Buttons & Theme Switcher */}
        <div className="flex items-center gap-3">
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg border border-white/10 hover:border-primary text-on-surface-variant hover:text-white transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>
          )}

          <Link href={ROUTES.login}>
            <button className="font-sans text-sm text-on-surface-variant hover:text-primary font-medium px-3 py-2 transition-colors">
              Sign In
            </button>
          </Link>

          <Link href={ROUTES.register}>
            <button className="bg-primary text-background font-sans text-sm font-bold py-2 px-4 rounded hover:opacity-90 transition-opacity">
              Start Building
            </button>
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-on-surface-variant hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-surface p-6 space-y-4 font-mono text-xs">
          <a href="#" onClick={() => setIsMobileMenuOpen(false)} className="block text-on-surface-variant py-1">
            Product
          </a>
          <a href="#workflow" onClick={() => setIsMobileMenuOpen(false)} className="block text-on-surface-variant py-1">
            How It Works
          </a>
          <a href="#agents" onClick={() => setIsMobileMenuOpen(false)} className="block text-on-surface-variant py-1">
            Agents
          </a>
          <Link href={ROUTES.dashboard} onClick={() => setIsMobileMenuOpen(false)} className="block text-on-surface-variant py-1">
            Workspace
          </Link>
        </div>
      )}
    </nav>
  );
}

/**
 * Hero Section - Matches User Specification.
 */
export function LandingHero() {
  return (
    <section className="pt-32 pb-16 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 blueprint-border p-6 md:p-12 bg-surface relative">
        {/* Content Column */}
        <div className="lg:col-span-6 flex flex-col justify-center gap-6 relative z-10">
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-white leading-tight">
            Build Software With an <span className="text-primary font-bold">AI Team.</span>
          </h1>
          <p className="font-sans text-base text-on-surface-variant max-w-lg leading-relaxed">
            HibirDev AI turns your software idea into product requirements, technical architecture, user experience, and implementation through four specialized AI agents.
          </p>
          <div className="pt-2">
            <Link href={ROUTES.register}>
              <button className="bg-primary text-background font-sans text-sm font-bold py-3 px-6 rounded hover:opacity-90 transition-opacity">
                Start Building
              </button>
            </Link>
          </div>
        </div>

        {/* Visual Live Status Simulation Box */}
        <div className="lg:col-span-6 relative bg-background border border-white/10 rounded p-4 md:p-6">
          <div className="font-mono text-xs text-on-surface-variant mb-4 flex justify-between items-center">
            <span>PROJECT_ID: STUDYMATE</span>
            <span className="text-primary font-bold">STATUS: COMPILING</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* CEO Agent */}
            <div className="flex items-center justify-between p-3 border border-white/10 bg-surface">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-on-surface-variant" />
                <span className="text-on-surface-variant">CEO_AGENT</span>
              </div>
              <span className="text-on-surface-variant">[DONE]</span>
            </div>

            {/* Architect Agent */}
            <div className="flex items-center justify-between p-3 border border-white/10 bg-surface">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-on-surface-variant" />
                <span className="text-on-surface-variant">ARCHITECT_AGENT</span>
              </div>
              <span className="text-on-surface-variant">[DONE]</span>
            </div>

            {/* Designer Agent */}
            <div className="flex items-center justify-between p-3 border border-primary bg-primary/10">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                <span className="text-primary font-bold">DESIGNER_AGENT</span>
              </div>
              <span className="text-primary font-bold">[ACTIVE]</span>
            </div>

            {/* Developer Agent */}
            <div className="flex items-center justify-between p-3 border border-white/10 bg-surface opacity-50">
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
 * Workflow Spine Section - Matches User Specification.
 */
export function LandingWorkflowSpine() {
  return (
    <section id="workflow" className="py-12 max-w-7xl mx-auto px-6 md:px-12">
      <div className="flex items-center justify-between font-mono text-xs text-on-surface-variant overflow-x-auto gap-2">
        <span className="font-bold text-white">IDEA</span>
        <div className="h-px flex-grow bg-white/10 min-w-[30px] relative mx-2">
          <div className="absolute left-0 top-0 h-full bg-primary w-1/4" />
        </div>
        <span className="font-bold text-white">PRODUCT</span>
        <div className="h-px flex-grow bg-white/10 min-w-[30px] relative mx-2">
          <div className="absolute left-0 top-0 h-full bg-primary w-0" />
        </div>
        <span className="font-bold text-white">ARCHITECTURE</span>
        <div className="h-px flex-grow bg-white/10 min-w-[30px] relative mx-2">
          <div className="absolute left-0 top-0 h-full bg-primary w-0" />
        </div>
        <span className="font-bold text-white">DESIGN</span>
        <div className="h-px flex-grow bg-white/10 min-w-[30px] relative mx-2">
          <div className="absolute left-0 top-0 h-full bg-primary w-0" />
        </div>
        <span className="font-bold text-white">CODE</span>
      </div>
    </section>
  );
}

/**
 * Footer - Matches User Specification.
 */
export function LandingFooter() {
  return (
    <footer className="bg-background w-full mt-auto border-t border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 px-6 md:px-12 py-12 max-w-7xl mx-auto">
        <div className="md:col-span-2 flex flex-col gap-2">
          <span className="font-heading text-lg font-bold text-white">{APP_NAME}</span>
          <span className="font-mono text-xs text-on-surface-variant opacity-80">
            © 2024 HibirDev AI. Engineering Excellence.
          </span>
        </div>

        <div className="md:col-span-4 flex flex-wrap gap-6 justify-start md:justify-end items-center font-mono text-xs">
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
            Product
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#workflow">
            How It Works
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#agents">
            Agents
          </a>
          <Link className="text-on-surface-variant hover:text-primary transition-colors" href={ROUTES.dashboard}>
            Workspace
          </Link>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
            Documentation
          </a>
        </div>
      </div>
    </footer>
  );
}
