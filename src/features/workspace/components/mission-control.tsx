'use client';

import React, { useState } from 'react';
import {
  FolderOpen,
  Folder,
  FileCode,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Brain,
  Send,
  Search,
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Bot,
} from 'lucide-react';

export function MissionControl() {
  const [promptText, setPromptText] = useState('');
  const [activeTab, setActiveTab] = useState('page.tsx');

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-on-background overflow-hidden font-sans">
      {/* Top Bar Navigation */}
      <header className="h-10 bg-surface border-b border-white/10 flex items-center justify-between px-4 text-xs font-mono shrink-0 z-20">
        <div className="flex items-center gap-4">
          <span className="font-heading font-extrabold text-primary tracking-wider">
            HIBIR_DEV_AI
          </span>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span>Project: StudyMate</span>
            <span className="opacity-40">/</span>
            <span className="text-primary font-bold">src/app/dashboard/page.tsx</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search codebase..."
              className="bg-background border border-white/10 text-white font-mono text-xs py-1 pl-8 pr-3 rounded focus:outline-none focus:border-primary w-48"
            />
          </div>
          <button
            type="button"
            className="bg-primary/10 border border-primary text-primary font-mono text-xs font-bold px-3 py-1 rounded flex items-center gap-2 glow-cyan"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>BUILDING</span>
          </button>
        </div>
      </header>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: File Explorer */}
        <aside className="w-60 bg-surface-container-low border-r border-white/10 flex flex-col shrink-0 text-xs font-mono">
          <div className="h-8 border-b border-white/10 flex items-center px-3 bg-surface text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">
            Explorer
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="flex items-center gap-1.5 py-1 text-primary font-bold">
              <ChevronDown className="w-3.5 h-3.5" />
              <FolderOpen className="w-3.5 h-3.5" />
              <span>StudyMate</span>
            </div>

            <div className="pl-4 space-y-1">
              <div className="flex items-center gap-1.5 py-1 text-on-surface-variant">
                <ChevronDown className="w-3.5 h-3.5" />
                <Folder className="w-3.5 h-3.5" />
                <span>app</span>
              </div>

              <div className="pl-4 space-y-1">
                <div className="flex items-center gap-1.5 py-1 text-on-surface-variant">
                  <ChevronDown className="w-3.5 h-3.5" />
                  <Folder className="w-3.5 h-3.5" />
                  <span>dashboard</span>
                </div>

                <div className="pl-4 space-y-1">
                  <div
                    onClick={() => setActiveTab('page.tsx')}
                    className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer ${
                      activeTab === 'page.tsx' ? 'bg-primary/10 text-primary border-l-2 border-primary font-bold' : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>page.tsx</span>
                  </div>
                  <div
                    onClick={() => setActiveTab('layout.tsx')}
                    className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer ${
                      activeTab === 'layout.tsx' ? 'bg-primary/10 text-primary border-l-2 border-primary font-bold' : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>layout.tsx</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Column 2: Editor & Pipeline & Terminal Stream */}
        <main className="flex-1 flex flex-col bg-background min-w-0 relative">
          {/* Pipeline Status Strip */}
          <div className="h-9 bg-surface border-b border-white/10 flex items-center px-4 gap-4 overflow-x-auto text-xs font-mono shrink-0">
            <span className="text-on-surface-variant uppercase text-[10px] font-bold">Pipeline Status:</span>
            <div className="flex items-center gap-1.5 text-on-surface-variant/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="line-through">CEO</span>
            </div>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <div className="flex items-center gap-1.5 text-on-surface-variant/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="line-through">Architect</span>
            </div>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <div className="flex items-center gap-1.5 text-on-surface-variant/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="line-through">Designer</span>
            </div>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/40 font-bold glow-cyan">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>DEVELOPER (Working)</span>
            </div>
          </div>

          {/* Editor Canvas */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs relative bg-background">
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-surface border border-primary px-3 py-1.5 rounded-lg text-primary z-10 font-bold glow-cyan">
              <Bot className="w-4 h-4 animate-pulse" />
              <span>AI Developing Code...</span>
            </div>

            <pre className="text-on-surface-variant leading-relaxed">
              <code>
                <span className="text-primary font-bold">import</span> React, &#123; useState, useEffect &#125; <span className="text-primary font-bold">from</span> <span className="text-tertiary">'react'</span>;<br />
                <span className="text-primary font-bold">import</span> &#123; DashboardLayout &#125; <span className="text-primary font-bold">from</span> <span className="text-tertiary">'@/components/layout'</span>;<br />
                <span className="text-primary font-bold">import</span> &#123; StudyStatsWidget &#125; <span className="text-primary font-bold">from</span> <span className="text-tertiary">'@/components/widgets'</span>;<br /><br />
                <span className="text-on-surface-variant/40">// AI: Injecting robust data fetching hook</span><br />
                <span className="text-primary font-bold">export default function</span> <span className="text-white font-bold">DashboardPage</span>() &#123;<br />
                &nbsp;&nbsp;<span className="text-primary">const</span> &#123; user &#125; = useUserContext();<br />
                &nbsp;&nbsp;<span className="text-primary">const</span> [studyData, setStudyData] = useState&lt;any&gt;(null);<br /><br />
                &nbsp;&nbsp;useEffect(() =&gt; &#123;<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">const</span> fetchData = <span className="text-primary">async</span> () =&gt; &#123;<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">const</span> res = <span className="text-primary">await</span> fetch(`/api/users/$&#123;user.id&#125;/stats`);<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">const</span> data = <span className="text-primary">await</span> res.json();<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;setStudyData(data);<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&#125;;<br />
                &nbsp;&nbsp;&nbsp;&nbsp;if (user) fetchData();<br />
                &nbsp;&nbsp;&#125;, [user]);<br /><br />
                &nbsp;&nbsp;<span className="text-primary">return</span> (<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-primary font-bold">DashboardLayout</span>&gt;<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-primary font-bold">StudyStatsWidget</span> data=&#123;studyData&#125; /&gt;<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-primary font-bold">DashboardLayout</span>&gt;<br />
                &nbsp;&nbsp;);<br />
                &#125;
              </code>
            </pre>
          </div>

          {/* Terminal Console Dock */}
          <div className="h-32 bg-surface border-t border-white/10 flex flex-col font-mono text-xs shrink-0">
            <div className="px-3 py-1.5 bg-background border-b border-white/10 flex justify-between items-center text-on-surface-variant text-[11px]">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-primary" />
                <span className="text-white font-bold">TERMINAL OUTPUT</span>
              </div>
              <span className="text-[10px] text-primary">BUILD SUCCESS (44ms)</span>
            </div>
            <div className="p-3 overflow-y-auto space-y-1 text-on-surface-variant text-[11px]">
              <div>&gt; npm run build</div>
              <div className="text-primary">▲ Next.js 14.2.0 production compilation</div>
              <div className="text-tertiary">✓ Compiled /app/dashboard/page.tsx successfully in 44ms</div>
              <div className="text-primary animate-pulse">⠋ Generating static optimization bundles...</div>
            </div>
          </div>
        </main>

        {/* Column 3: AI Context Panel */}
        <aside className="w-72 bg-surface-container-low border-l border-white/10 flex flex-col shrink-0 font-mono text-xs">
          <div className="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-surface text-primary font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span>AI CONTEXT</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-background border border-white/10 p-3 rounded-lg space-y-2">
              <span className="text-[10px] text-on-surface-variant uppercase font-bold border-b border-white/10 pb-1 block">
                CURRENT TASK
              </span>
              <p className="text-white">Implementing user stats dashboard layout and widgets.</p>
            </div>

            <div className="bg-background border border-white/10 p-3 rounded-lg space-y-2">
              <span className="text-[10px] text-on-surface-variant uppercase font-bold border-b border-white/10 pb-1 block">
                CONTEXT MEMORY
              </span>
              <div className="space-y-2 text-[11px] text-on-surface-variant">
                <div className="p-2 bg-surface border border-white/10 rounded">
                  <span className="text-tertiary font-bold block mb-1">Architect Note:</span>
                  Ensure responsive grid breakpoints on mobile devices.
                </div>
                <div className="p-2 bg-surface border border-white/10 rounded">
                  <span className="text-primary font-bold block mb-1">Designer Note:</span>
                  Use Tech Teal accent tokens `#00ACAC` for primary focus buttons.
                </div>
              </div>
            </div>
          </div>

          {/* AI Prompt Input */}
          <div className="p-3 border-t border-white/10 bg-surface">
            <div className="relative">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Instruct AI developer..."
                className="w-full bg-background border border-white/10 text-white font-mono text-xs p-3 pr-8 focus:border-primary focus:outline-none resize-none h-20 rounded-lg"
              />
              <button
                type="button"
                aria-label="Send prompt to AI developer"
                className="absolute bottom-2.5 right-2.5 text-primary hover:text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between items-center mt-2 text-[10px] text-on-surface-variant">
              <span>Agent: Developer</span>
              <span>Model: Claude 3.5 Sonnet</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
