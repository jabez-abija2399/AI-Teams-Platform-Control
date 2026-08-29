'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Monitor, Tablet, Smartphone, RotateCcw, ExternalLink, ArrowLeft, Bot, Sparkles, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/config/constants';

interface PreviewSandboxShellProps {
  projectId: string;
  projectName: string;
  previewHtml: string | null;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

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
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden text-white font-sans">
      {/* Top Navigation Bar */}
      <header className="h-14 shrink-0 border-b border-white/10 bg-surface/90 backdrop-blur-xl px-4 flex items-center justify-between z-20 shadow-md">
        {/* Left: Back to Workspace & Project Name */}
        <div className="flex items-center gap-3">
          <Link
            href={`${ROUTES.projects}/${projectId}/workspace`}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-on-surface-variant hover:text-white transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Workspace</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs font-bold text-white truncate max-w-[200px]">
            {projectName}
          </span>
          <span className="rounded-full bg-primary/20 text-primary border border-primary/40 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider hidden md:inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-primary animate-pulse" /> Sandbox Live
          </span>
        </div>

        {/* Center: Viewport Switcher Controls */}
        <div className="flex items-center gap-1 bg-surface-container-high border border-white/10 rounded-xl p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-lg transition-all ${
              viewport === 'desktop'
                ? 'bg-primary text-background glow-cyan font-bold'
                : 'text-on-surface-variant hover:text-white'
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
                ? 'bg-primary text-background glow-cyan font-bold'
                : 'text-on-surface-variant hover:text-white'
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
                ? 'bg-primary text-background glow-cyan font-bold'
                : 'text-on-surface-variant hover:text-white'
            }`}
            title="Mobile Viewport (375px)"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reloadIframe}
            className="p-2 rounded-xl border border-white/10 bg-surface-container-high hover:border-primary text-on-surface-variant hover:text-white transition-all text-xs font-mono font-bold"
            title="Reload Preview"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 bg-background flex items-center justify-center p-4 overflow-hidden relative">
        <div className={`transition-all duration-300 overflow-hidden ${getViewportWidthClass()}`}>
          {previewHtml ? (
            <iframe
              key={key}
              srcDoc={previewHtml}
              className="w-full h-full border-none bg-white"
              title="Live Application Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-surface border border-white/10 p-8 text-center">
              <Sparkles className="w-12 h-12 text-primary animate-pulse mb-4" />
              <h3 className="font-heading text-lg font-bold text-white mb-2">Compiling Live Application Sandbox</h3>
              <p className="font-mono text-xs text-on-surface-variant max-w-md leading-relaxed">
                Alex Developer is assembling client components. The live preview will reload automatically upon compilation completion.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
