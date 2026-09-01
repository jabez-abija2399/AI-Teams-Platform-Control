'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  FolderOpen,
  Folder,
  FileCode,
  CheckCircle2,
  RefreshCw,
  Terminal as TerminalIcon,
  Brain,
  Send,
  Search,
  Settings,
  ChevronDown,
  ChevronRight,
  Bot,
  ArrowLeft,
  Workflow,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  X,
  Plus,
  Play,
} from 'lucide-react';
import { ROUTES } from '@/config/constants';
import { ActionRequiredBanner } from './action-required-banner';
import { SystemArchitecture } from '@/features/architecture/components/system-architecture';
import { ArtifactsRegistry } from '@/features/artifacts/components/artifacts-registry';

interface WorkspaceClientShellProps {
  projectId: string;
  projectName: string;
}

const FILE_CONTENTS: Record<string, string> = {
  'page.tsx': `import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { StudyStatsWidget } from '@/components/widgets';

// AI: Injecting robust data fetching hook for ${'${projectName}'}
export default function DashboardPage() {
  const [studyData, setStudyData] = useState<any|null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setStudyData(data);
      } catch (error) {
        console.error("Failed to load stats", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="p-4 font-mono text-xs">Loading workspace...</div>;

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        <div className="col-span-2">
          <h1 className="text-2xl font-bold mb-4">Welcome to StudyMate</h1>
          <p className="text-xs opacity-70">Autonomous AI build pipeline operational.</p>
        </div>
        <StudyStatsWidget data={studyData} />
      </div>
    </DashboardLayout>
  );
}`,
  'layout.tsx': `import React from 'react';
import '@/app/globals.css';

export const metadata = {
  title: 'StudyMate AI Platform',
  description: 'AI-powered study assistant application built with HibirDev AI workforce',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-on-background antialiased font-sans">
        {children}
      </body>
    </html>
  );
}`,
  'styles.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #000000;
  --surface: #1B1B1B;
  --primary: #00ACAC;
  --on-surface: #DFDEDC;
  --border-line: #464545;
}

.blueprint-grid {
  background-image: 
    linear-gradient(to right, #464545 1px, transparent 1px),
    linear-gradient(to bottom, #464545 1px, transparent 1px);
  background-size: 64px 64px;
}`,
  'package.json': `{
  "name": "studymate-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "lucide-react": "^0.380.0",
    "tailwindcss": "^3.4.0"
  }
}`,
  'README.md': `# StudyMate AI Platform

Generated autonomously by **HibirDev AI Workforce**.

## Pipeline Architecture
- **CEO Agent**: Synthesized Product Specification (PRD)
- **Architect Agent**: Designed Microservices & DB Topology
- **Designer Agent**: Generated Technical Precision UI Tokens
- **Developer Agent**: Compiling Next.js Application Bundle
`,
};

export function WorkspaceClientShell({ projectId, projectName }: WorkspaceClientShellProps) {
  const [promptText, setPromptText] = useState('');
  const [activeTab, setActiveTab] = useState('page.tsx');
  const [openTabs, setOpenTabs] = useState<string[]>(['page.tsx', 'layout.tsx']);
  const [activeSubView, setActiveSubView] = useState<'ide' | 'architecture' | 'artifacts' | 'agents'>('ide');

  // Toggle Panel States
  const [showExplorer, setShowExplorer] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showAiContext, setShowAiContext] = useState(true);
  const [terminalTab, setTerminalTab] = useState<'terminal' | 'output' | 'problems'>('terminal');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '> npm run build',
    '▲ Next.js 14.2.0 production compilation',
    '✓ Compiled /app/dashboard/page.tsx successfully in 44ms',
    '⠋ Generating static optimization pages (2/8)...',
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  const handleSelectFile = (fileName: string) => {
    if (!openTabs.includes(fileName)) {
      setOpenTabs([...openTabs, fileName]);
    }
    setActiveTab(fileName);
  };

  const handleCloseTab = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = openTabs.filter((t) => t !== fileName);
    setOpenTabs(updated);
    if (activeTab === fileName && updated.length > 0) {
      setActiveTab(updated[updated.length - 1] || 'page.tsx');
    }
  };

  const handleRunTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    setTerminalLogs((prev) => [...prev, `> ${cmd}`, `Executed command: ${cmd} [OK]`]);
    setTerminalInput('');
  };

  return (
    <div className="min-h-screen w-full bg-background text-on-background flex flex-col font-sans overflow-hidden">
      {/* Top NavBar */}
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
            <span className="text-primary font-bold">src/app/dashboard/{activeTab}</span>
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
            onClick={() => setShowExplorer(!showExplorer)}
            className="p-1.5 rounded border border-white/10 text-on-surface-variant hover:text-white transition-colors"
            title="Toggle File Explorer Sidebar"
          >
            {showExplorer ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setShowTerminal(!showTerminal)}
            className="p-1.5 rounded border border-white/10 text-on-surface-variant hover:text-white transition-colors"
            title="Toggle Terminal Dock"
          >
            <TerminalIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="bg-primary text-black font-mono text-xs font-bold px-3 py-1 rounded flex items-center gap-2 uppercase tracking-wider glow-cyan"
          >
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span>BUILDING</span>
          </button>
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
              onClick={() => setActiveSubView('ide')}
              className={`w-full p-3 flex flex-col items-center justify-center transition-colors border-l-2 ${
                activeSubView === 'ide' ? 'border-primary text-primary bg-surface-container-high' : 'border-transparent text-on-surface-variant hover:text-white'
              }`}
              title="Mission Control IDE"
            >
              <FolderOpen className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('architecture')}
              className={`w-full p-3 flex flex-col items-center justify-center transition-colors border-l-2 ${
                activeSubView === 'architecture' ? 'border-primary text-primary bg-surface-container-high' : 'border-transparent text-on-surface-variant hover:text-white'
              }`}
              title="System Architecture Graph"
            >
              <Workflow className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('artifacts')}
              className={`w-full p-3 flex flex-col items-center justify-center transition-colors border-l-2 ${
                activeSubView === 'artifacts' ? 'border-primary text-primary bg-surface-container-high' : 'border-transparent text-on-surface-variant hover:text-white'
              }`}
              title="Artifacts Registry"
            >
              <FileText className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('agents')}
              className={`w-full p-3 flex flex-col items-center justify-center transition-colors border-l-2 ${
                activeSubView === 'agents' ? 'border-primary text-primary bg-surface-container-high' : 'border-transparent text-on-surface-variant hover:text-white'
              }`}
              title="AI Agent Workforce"
            >
              <Bot className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-auto border-t border-white/10 pt-3 w-full items-center">
            <Link href="/dashboard/settings" title="Settings" className="p-2 text-on-surface-variant hover:text-white">
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </aside>

        {/* SUB-VIEW 1: MISSION CONTROL IDE */}
        {activeSubView === 'ide' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Column 1: Collapsible File Explorer (w-64) */}
            {showExplorer && (
              <aside className="w-64 bg-surface-container-low border-r border-white/10 flex flex-col shrink-0 text-xs font-mono">
                <div className="h-8 border-b border-white/10 flex items-center justify-between px-3 bg-surface text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">
                  <span>Explorer</span>
                  <button
                    type="button"
                    onClick={() => setShowExplorer(false)}
                    className="hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <div className="flex items-center gap-1.5 py-1 text-primary font-bold">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{projectName || 'StudyMate'}</span>
                  </div>

                  <div className="pl-4 space-y-1">
                    {/* app/dashboard */}
                    <div className="flex items-center gap-1.5 py-1 text-on-surface-variant">
                      <ChevronDown className="w-3.5 h-3.5" />
                      <Folder className="w-3.5 h-3.5" />
                      <span>app / dashboard</span>
                    </div>

                    <div className="pl-4 space-y-1">
                      {['page.tsx', 'layout.tsx', 'styles.css'].map((fileName) => (
                        <div
                          key={fileName}
                          onClick={() => handleSelectFile(fileName)}
                          className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer ${
                            activeTab === fileName ? 'bg-primary/10 text-primary border-l-2 border-primary font-bold' : 'text-on-surface-variant hover:text-white'
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5 text-primary" />
                          <span>{fileName}</span>
                        </div>
                      ))}
                    </div>

                    {/* Root configuration files */}
                    <div className="flex items-center gap-1.5 py-1 text-on-surface-variant pt-2 border-t border-white/10">
                      <ChevronDown className="w-3.5 h-3.5" />
                      <Folder className="w-3.5 h-3.5" />
                      <span>root configs</span>
                    </div>

                    <div className="pl-4 space-y-1">
                      {['package.json', 'README.md'].map((fileName) => (
                        <div
                          key={fileName}
                          onClick={() => handleSelectFile(fileName)}
                          className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer ${
                            activeTab === fileName ? 'bg-primary/10 text-primary border-l-2 border-primary font-bold' : 'text-on-surface-variant hover:text-white'
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5 text-primary" />
                          <span>{fileName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {/* Column 2: Code Editor & Workflow Strip & Collapsible Terminal */}
            <main className="flex-1 flex flex-col bg-background min-w-0 relative">
              {/* Pipeline Status Strip */}
              <div className="h-10 bg-surface border-b border-white/10 flex items-center justify-between px-4 text-xs font-mono shrink-0">
                <div className="flex items-center gap-4 overflow-x-auto">
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

                <button
                  type="button"
                  onClick={() => setShowAiContext(!showAiContext)}
                  className="text-on-surface-variant hover:text-white p-1 rounded border border-white/10 text-[10px] uppercase font-bold"
                >
                  {showAiContext ? 'Hide AI Context' : 'Show AI Context'}
                </button>
              </div>

              {/* Editor Open Tabs Bar */}
              <div className="flex h-9 bg-surface-container-low border-b border-white/10 font-mono text-xs overflow-x-auto shrink-0">
                {openTabs.map((tab) => (
                  <div
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 flex items-center gap-2 border-r border-white/10 cursor-pointer min-w-[140px] justify-between ${
                      activeTab === tab
                        ? 'bg-background text-primary border-t-2 border-t-primary font-bold'
                        : 'text-on-surface-variant hover:bg-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5" />
                      <span>{tab}</span>
                    </div>
                    {openTabs.length > 1 && (
                      <X
                        className="w-3 h-3 hover:text-white opacity-60 hover:opacity-100"
                        onClick={(e) => handleCloseTab(tab, e)}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Code Canvas Container */}
              <div className="flex-1 overflow-auto p-6 font-mono text-xs relative bg-background">
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-surface border border-primary px-3 py-1.5 rounded-lg text-primary z-10 font-bold glow-cyan">
                  <Bot className="w-4 h-4 animate-pulse text-primary" />
                  <span>AI Developing...</span>
                </div>

                <pre className="text-on-surface-variant leading-relaxed">
                  <code>{FILE_CONTENTS[activeTab] || FILE_CONTENTS['page.tsx']}</code>
                </pre>
              </div>

              {/* Collapsible Terminal Console Dock */}
              {showTerminal && (
                <div className="h-40 bg-surface border-t border-white/10 flex flex-col font-mono text-xs shrink-0">
                  {/* Terminal Header & Tabs */}
                  <div className="px-3 py-1.5 bg-background border-b border-white/10 flex justify-between items-center text-on-surface-variant text-[11px]">
                    <div className="flex items-center gap-4">
                      {(['terminal', 'output', 'problems'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setTerminalTab(tab)}
                          className={`uppercase font-bold transition-colors pb-0.5 ${
                            terminalTab === tab ? 'text-primary border-b border-primary' : 'text-on-surface-variant hover:text-white'
                          }`}
                        >
                          {tab} {tab === 'problems' && '(0)'}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-primary text-[10px] font-bold uppercase">STATUS: ONLINE</span>
                      <button
                        type="button"
                        onClick={() => setShowTerminal(false)}
                        className="text-on-surface-variant hover:text-white ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Terminal Log View */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-1 text-on-surface-variant text-[11px] bg-background">
                    {terminalTab === 'terminal' && (
                      <>
                        {terminalLogs.map((log, idx) => (
                          <div key={idx} className={log.startsWith('>') ? 'text-white font-bold' : log.includes('✓') ? 'text-primary' : ''}>
                            {log}
                          </div>
                        ))}
                      </>
                    )}

                    {terminalTab === 'output' && (
                      <div className="text-on-surface-variant">
                        [SYS] Build Target: Next.js 14 App Router (Node.js 20.x runtime)<br />
                        [NET] Gateway Latency: 42ms • Zero-Knowledge Encryption Enabled
                      </div>
                    )}

                    {terminalTab === 'problems' && (
                      <div className="text-primary font-bold">
                        ✓ No linting or compilation errors found in codebase.
                      </div>
                    )}
                  </div>

                  {/* Terminal Interactive Input */}
                  <form onSubmit={handleRunTerminalCommand} className="border-t border-white/10 bg-surface px-3 py-1.5 flex items-center gap-2">
                    <span className="text-primary font-bold">$</span>
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder="Type command (e.g. npm run build, git status)..."
                      className="w-full bg-transparent border-none text-white font-mono text-xs focus:outline-none placeholder:text-on-surface-variant/40"
                    />
                  </form>
                </div>
              )}
            </main>

            {/* Column 3: Collapsible AI Context Panel (w-80) */}
            {showAiContext && (
              <aside className="w-80 bg-surface-container-low border-l border-white/10 flex flex-col shrink-0 font-mono text-xs">
                <div className="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-surface text-primary font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    <span>AI CONTEXT</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiContext(false)}
                    className="text-on-surface-variant hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
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
            )}
          </div>
        )}

        {/* SUB-VIEW 2: SYSTEM ARCHITECTURE GRAPH */}
        {activeSubView === 'architecture' && (
          <div className="flex-1 overflow-y-auto">
            <SystemArchitecture />
          </div>
        )}

        {/* SUB-VIEW 3: ARTIFACTS REGISTRY */}
        {activeSubView === 'artifacts' && (
          <div className="flex-1 overflow-y-auto">
            <ArtifactsRegistry />
          </div>
        )}

        {/* SUB-VIEW 4: AGENTS ROSTER */}
        {activeSubView === 'agents' && (
          <div className="flex-1 p-6 md:p-8 font-mono text-xs space-y-6 overflow-y-auto">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3">
              AUTONOMOUS WORKFORCE ROSTER ({projectName})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface p-4 rounded-xl border border-white/10 space-y-2">
                <span className="text-primary font-bold">NODE_01: CEO</span>
                <p className="text-on-surface-variant">Product Requirements Document</p>
                <div className="text-[10px] text-primary font-bold">STATUS: COMPLETED (100%)</div>
              </div>
              <div className="bg-surface p-4 rounded-xl border border-white/10 space-y-2">
                <span className="text-primary font-bold">NODE_02: ARCHITECT</span>
                <p className="text-on-surface-variant">System Microservices Graph</p>
                <div className="text-[10px] text-primary font-bold">STATUS: COMPLETED (100%)</div>
              </div>
              <div className="bg-surface p-4 rounded-xl border border-white/10 space-y-2">
                <span className="text-primary font-bold">NODE_03: DESIGNER</span>
                <p className="text-on-surface-variant">UI/UX & Design Tokens</p>
                <div className="text-[10px] text-primary font-bold">STATUS: WORKING (85%)</div>
              </div>
              <div className="bg-surface p-4 rounded-xl border border-white/10 space-y-2">
                <span className="text-primary font-bold">NODE_04: DEVELOPER</span>
                <p className="text-on-surface-variant">Code Synthesis & Execution</p>
                <div className="text-[10px] text-on-surface-variant">STATUS: WAITING (0%)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
