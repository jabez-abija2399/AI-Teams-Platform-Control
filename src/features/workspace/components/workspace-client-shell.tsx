'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
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
  Bot,
  ArrowLeft,
  Workflow,
  Sparkles,
  HelpCircle,
  FileText,
  Plus,
  Play,
  Share2,
} from 'lucide-react';
import { ROUTES } from '@/config/constants';
import { ActionRequiredBanner } from './action-required-banner';

interface WorkspaceClientShellProps {
  projectId: string;
  projectName: string;
}

export function WorkspaceClientShell({ projectId, projectName }: WorkspaceClientShellProps) {
  const [promptText, setPromptText] = useState('');
  const [activeTab, setActiveTab] = useState('page.tsx');
  const [activeSideTab, setActiveSideTab] = useState<'explorer' | 'workflow' | 'agents' | 'logs' | 'settings'>('explorer');

  return (
    <div className="min-h-screen w-full bg-background text-on-background flex flex-col font-sans overflow-hidden">
      {/* Top NavBar (hibirdev_ai_mission_control_desktop specification) */}
      <nav className="h-12 bg-surface border-b border-white/10 flex items-center justify-between px-4 text-xs font-mono shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Link href={ROUTES.dashboard} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-heading font-extrabold text-primary tracking-wider text-sm">
            HIBIR_DEV_AI
          </span>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span>Project: <strong className="text-white">{projectName || 'StudyMate'}</strong></span>
            <span className="opacity-40">/</span>
            <span className="text-primary font-bold">src/app/dashboard/page.tsx</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search codebase..."
              className="bg-background border border-white/10 text-white font-mono text-xs py-1 pl-8 pr-3 rounded focus:outline-none focus:border-primary w-48"
            />
          </div>

          <button
            type="button"
            className="bg-transparent border border-white/10 text-white font-mono text-xs px-3 py-1 rounded hover:bg-white/5 transition-colors uppercase tracking-wider"
          >
            DEPLOY
          </button>

          <button
            type="button"
            className="bg-primary text-black font-mono text-xs font-bold px-3 py-1 rounded flex items-center gap-2 uppercase tracking-wider glow-cyan"
          >
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span>BUILDING</span>
          </button>

          <div className="flex items-center border-l border-white/10 pl-3 gap-2 text-on-surface-variant">
            <Terminal className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <Settings className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>
      </nav>

      {/* Action Required Banner Dock */}
      <ActionRequiredBanner title="ACTION REQUIRED: Design specification is ready for review." />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Side Rail (64px / w-16) */}
        <aside className="w-16 bg-surface border-r border-white/10 flex flex-col items-center py-3 font-mono text-[10px] shrink-0 z-20">
          <div className="flex flex-col gap-2 w-full flex-1">
            <button
              type="button"
              onClick={() => setActiveSideTab('workflow')}
              className={`w-full p-3 flex flex-col items-center justify-center transition-colors border-l-2 ${
                activeSideTab === 'workflow' ? 'border-primary text-primary bg-surface-container-high' : 'border-transparent text-on-surface-variant hover:text-white'
              }`}
              title="Workflow"
            >
              <Workflow className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveSideTab('explorer')}
              className={`w-full p-3 flex flex-col items-center justify-center transition-colors border-l-2 ${
                activeSideTab === 'explorer' ? 'border-primary text-primary bg-surface-container-high' : 'border-transparent text-on-surface-variant hover:text-white'
              }`}
              title="Explorer"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveSideTab('agents')}
              className={`w-full p-3 flex flex-col items-center justify-center transition-colors border-l-2 ${
                activeSideTab === 'agents' ? 'border-primary text-primary bg-surface-container-high' : 'border-transparent text-on-surface-variant hover:text-white'
              }`}
              title="Agents"
            >
              <Bot className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveSideTab('logs')}
              className={`w-full p-3 flex flex-col items-center justify-center transition-colors border-l-2 ${
                activeSideTab === 'logs' ? 'border-primary text-primary bg-surface-container-high' : 'border-transparent text-on-surface-variant hover:text-white'
              }`}
              title="Logs"
            >
              <Terminal className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-auto border-t border-white/10 pt-3 w-full items-center">
            <button type="button" title="Docs" className="p-2 text-on-surface-variant hover:text-white">
              <FileText className="w-5 h-5" />
            </button>
            <button type="button" title="Help" className="p-2 text-on-surface-variant hover:text-white">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="bg-primary text-black font-mono text-[9px] font-bold px-1.5 py-1 rounded uppercase tracking-wider mt-1"
            >
              NEW_NODE
            </button>
          </div>
        </aside>

        {/* 3-Column Mission Control IDE Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Column 1: File Explorer (w-64) */}
          <aside className="w-64 bg-surface-container-low border-r border-white/10 flex flex-col shrink-0 text-xs font-mono">
            <div className="h-8 border-b border-white/10 flex items-center px-3 bg-surface text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">
              Explorer
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="flex items-center gap-1.5 py-1 text-primary font-bold">
                <ChevronDown className="w-3.5 h-3.5" />
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{projectName || 'StudyMate'}</span>
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
                      <FileCode className="w-3.5 h-3.5 text-primary" />
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

                <div className="flex items-center gap-1.5 py-1 text-on-surface-variant">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <Folder className="w-3.5 h-3.5" />
                  <span>components</span>
                </div>
                <div className="flex items-center gap-1.5 py-1 text-on-surface-variant">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <Folder className="w-3.5 h-3.5" />
                  <span>lib</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Column 2: Code Editor & Workflow Strip & Terminal */}
          <main className="flex-1 flex flex-col bg-background min-w-0 relative">
            {/* Pipeline Status Strip */}
            <div className="h-10 bg-surface border-b border-white/10 flex items-center px-4 gap-4 overflow-x-auto text-xs font-mono shrink-0">
              <span className="text-on-surface-variant uppercase text-[10px] font-bold shrink-0">Pipeline Status:</span>
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
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded border border-primary/40 font-bold glow-cyan">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>DEVELOPER (Working)</span>
              </div>
            </div>

            {/* Code Canvas */}
            <div className="flex-1 overflow-auto p-6 font-mono text-xs relative bg-background">
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-surface border border-primary px-3 py-1.5 rounded-lg text-primary z-10 font-bold glow-cyan">
                <Bot className="w-4 h-4 animate-pulse text-primary" />
                <span>AI Developing...</span>
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

            {/* Collapsed Terminal */}
            <div className="h-32 bg-surface border-t border-white/10 flex flex-col font-mono text-xs shrink-0">
              <div className="px-3 py-1.5 bg-background border-b border-white/10 flex justify-between items-center text-on-surface-variant text-[11px]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  <span className="text-white font-bold">TERMINAL LOGS</span>
                </div>
                <span className="text-primary text-[10px] font-bold">✓ COMPILED SUCCESSFULLY</span>
              </div>
              <div className="p-3 overflow-y-auto space-y-1 text-on-surface-variant text-[11px]">
                <div>&gt; npm run build</div>
                <div className="text-primary">▲ Next.js 14.2.0 production compilation</div>
                <div className="text-tertiary">✓ Compiled /app/dashboard/page.tsx successfully in 44ms</div>
                <div className="text-primary animate-pulse">⠋ Generating static optimization pages (2/8)...</div>
              </div>
            </div>
          </main>

          {/* Column 3: AI Context Panel (w-80) */}
          <aside className="w-80 bg-surface-container-low border-l border-white/10 flex flex-col shrink-0 font-mono text-xs">
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
                <p className="text-white">Implementing user stats dashboard layout and widgets for {projectName || 'StudyMate'}.</p>
                <ul className="text-on-surface-variant text-[11px] space-y-1 list-disc list-inside">
                  <li>Fetch user stats</li>
                  <li>Setup responsive grid</li>
                  <li className="text-primary font-bold">Inject StudyStatsWidget</li>
                </ul>
              </div>

              <div className="bg-background border border-white/10 p-3 rounded-lg space-y-2">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold border-b border-white/10 pb-1 block">
                  CONTEXT MEMORY
                </span>
                <div className="space-y-2 text-[11px] text-on-surface-variant">
                  <div className="p-2.5 bg-surface border border-white/10 rounded">
                    <span className="text-tertiary font-bold block mb-1">Architect Note:</span>
                    Ensure the dashboard grid falls back gracefully on mobile devices (md breakpoint).
                  </div>
                  <div className="p-2.5 bg-surface border border-white/10 rounded">
                    <span className="text-primary font-bold block mb-1">Designer Note:</span>
                    Use 'StudyStatsWidget' from the new component library.
                  </div>
                </div>
              </div>
            </div>

            {/* AI Chat Prompt Input */}
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
                  aria-label="Send instructions to AI developer"
                  className="absolute bottom-2.5 right-2.5 text-primary hover:text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-center mt-2 text-[10px] text-on-surface-variant">
                <span>Agent: Developer</span>
                <span>Tokens: 4.2k</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
