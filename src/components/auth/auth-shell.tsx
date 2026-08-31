'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/layout/logo';
import { ArrowDown, Brain, Layers, Sparkles, Terminal, Sun, Moon } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/config/constants';
import { useTheme } from 'next-themes';

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSignup = pathname?.includes('signup') || pathname?.includes('register');
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="bg-background text-on-background min-h-screen flex selection:bg-primary selection:text-background overflow-hidden font-sans">
      {/* SECTION 1: LEFT PANEL (45% Width on Desktop) */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-background border-r border-white/10 px-12 py-12 relative overflow-hidden">
        {/* Top Logo */}
        <div className="z-10 flex items-center justify-between">
          <Link href={ROUTES.home} className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-primary/40 text-primary shadow-[0_0_12px_rgba(0,242,254,0.25)] group-hover:scale-105 transition-transform">
              <Logo size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-heading group-hover:text-primary transition-colors">
              {APP_NAME}
            </span>
          </Link>

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
        </div>

        {/* Center Content */}
        <div className="z-10 flex flex-col gap-8 max-w-md my-auto">
          <div>
            <h1 className="font-heading text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
              {isSignup ? 'Start building with your AI team.' : 'Your AI software team is ready.'}
            </h1>
            <p className="font-sans text-base text-on-surface-variant leading-relaxed">
              Deploy specialized autonomous agents. Scale your architecture with precision engineering.
            </p>
          </div>

          {/* Workflow Pipeline Visual for Signup / Login */}
          {isSignup ? (
            <div className="flex flex-col gap-2 font-mono text-xs font-bold text-on-surface-variant uppercase tracking-widest pl-3 border-l-2 border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">IDEA</span>
              </div>
              <ArrowDown className="w-4 h-4 text-on-surface-variant opacity-60 ml-0.5" />
              <div className="flex items-center gap-3">
                <span>CEO</span>
              </div>
              <ArrowDown className="w-4 h-4 text-on-surface-variant opacity-60 ml-0.5" />
              <div className="flex items-center gap-3">
                <span>ARCHITECT</span>
              </div>
              <ArrowDown className="w-4 h-4 text-on-surface-variant opacity-60 ml-0.5" />
              <div className="flex items-center gap-3">
                <span>DESIGNER</span>
              </div>
              <ArrowDown className="w-4 h-4 text-on-surface-variant opacity-60 ml-0.5" />
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">DEVELOPER</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pl-4 border-l border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface border border-white/10 flex items-center justify-center text-on-surface-variant">
                  <Brain className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  CEO Agent
                </span>
              </div>
              <div className="w-px h-3 bg-white/10 ml-4" />

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface border border-white/10 flex items-center justify-center text-on-surface-variant">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Architect
                </span>
              </div>
              <div className="w-px h-3 bg-white/10 ml-4" />

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface border border-white/10 flex items-center justify-center text-on-surface-variant">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Designer
                </span>
              </div>
              <div className="w-px h-3 bg-white/10 ml-4" />

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface border border-primary/40 flex items-center justify-center text-primary glow-border">
                  <Terminal className="w-4 h-4 text-primary" />
                </div>
                <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
                  Developer
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Text */}
        <div className="z-10">
          <span className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
            {APP_NAME.toUpperCase()} / SOFTWARE ENGINEERING PLATFORM / NODE: 01
          </span>
        </div>

        {/* Subtle Background Dot Grid */}
        <div
          className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* SECTION 2: RIGHT PANEL (55% Width on Desktop, 100% Mobile) */}
      <div className="w-full lg:w-[55%] bg-background flex flex-col justify-center items-center p-6 relative">
        {/* Mobile Logo & Theme Control */}
        <div className="lg:hidden absolute top-6 left-6 right-6 flex items-center justify-between z-20">
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-primary/40 text-primary">
              <Logo size={18} />
            </div>
            <span className="text-base font-bold text-white font-heading">{APP_NAME}</span>
          </Link>
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg border border-white/10 text-on-surface-variant"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>
          )}
        </div>

        <div className="w-full max-w-[440px] flex flex-col gap-8 z-10">{children}</div>

        {/* Technical Status Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
          <span className="font-mono text-[10px] text-on-surface-variant opacity-60 tracking-widest uppercase font-bold">
            {APP_NAME.toUpperCase()} / SOFTWARE ENGINEERING PLATFORM
          </span>
        </div>
      </div>
    </main>
  );
}
