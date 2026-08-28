'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Monitor, Tablet, Smartphone, RotateCcw, ExternalLink, ArrowLeft, Bot, Sparkles } from 'lucide-react';
import { NeonButton, GlassCard } from '@/packages/ui';
import { ROUTES } from '@/config/constants';

interface PreviewSandboxShellProps {
  projectId: string;
  projectName: string;
  previewHtml: string | null;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

/**
 * Ultra-Modern Cyber Void Live Preview Sandbox Shell.
 * Features responsive viewport emulation (Desktop, Tablet, Mobile), live reload, and external window viewing.
 */
export function PreviewSandboxShell({ projectId, projectName, previewHtml }: PreviewSandboxShellProps) {
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [key, setKey] = useState(0);

  const reloadIframe = () => {
    setKey((prev) => prev + 1);
  };

  const getViewportWidthClass = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[375px] h-[667px] rounded-3xl border-4 border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)]';
      case 'tablet':
        return 'w-[768px] h-[90vh] rounded-2xl border-2 border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)]';
      case 'desktop':
      default:
        return 'w-full h-full rounded-none border-none';
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-void overflow-hidden text-white font-sans">
      {/* Top Cyber Void Sandbox Navigation Bar */}
      <header className="h-14 shrink-0 border-b border-white/10 bg-surface-glass/80 backdrop-blur-xl px-4 flex items-center justify-between z-20 shadow-md">
        {/* Left: Back to Workspace & Project Name */}
        <div className="flex items-center gap-3">
          <Link
            href={`${ROUTES.projects}/${projectId}/workspace`}
            className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Workspace</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs font-bold text-white truncate max-w-[200px]">
            {projectName}
          </span>
          <span className="rounded-full bg-success/20 text-success border border-success/30 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider hidden md:inline">
            Sandbox Live
          </span>
        </div>

        {/* Center: Viewport Switcher Controls */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-lg transition-all ${
              viewport === 'desktop'
                ? 'bg-primary text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                : 'text-white/40 hover:text-white'
            }`}
            title="Desktop Viewport"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded-lg transition-all ${
              viewport === 'tablet'
                ? 'bg-primary text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                : 'text-white/40 hover:text-white'
            }`}
            title="Tablet Viewport (768px)"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-lg transition-all ${
              viewport === 'mobile'
                ? 'bg-primary text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                : 'text-white/40 hover:text-white'
            }`}
            title="Mobile Viewport (375px)"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions (Reload, External Link) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reloadIframe}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all text-xs"
            title="Reload Preview"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Sandbox Frame Container */}
      <main className="flex-1 flex items-center justify-center p-0 md:p-4 bg-void relative overflow-hidden">
        {previewHtml ? (
          <div className={`transition-all duration-300 overflow-hidden ${getViewportWidthClass()}`}>
            <iframe
              key={key}
              srcDoc={previewHtml}
              className="h-full w-full bg-white"
              title={`${projectName} Preview`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-presentation"
            />
          </div>
        ) : (
          <GlassCard className="max-w-md p-8 text-center border-primary/20 bg-gradient-to-b from-surface-glass/90 to-primary/5 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/40 shadow-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">{projectName}</h2>
            <p className="text-xs text-white/60 leading-relaxed mb-6">
              No previewable HTML bundle generated yet. Return to the workspace to command your AI team.
            </p>
            <Link href={`${ROUTES.projects}/${projectId}/workspace`}>
              <NeonButton variant="primary" className="w-full h-11 text-xs font-bold">
                <Bot className="w-4 h-4 mr-2" />
                Open Live Workspace
              </NeonButton>
            </Link>
          </GlassCard>
        )}
      </main>
    </div>
  );
}
