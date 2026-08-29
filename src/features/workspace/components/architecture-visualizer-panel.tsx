'use client';

import React from 'react';
import {
  Network,
  Database,
  Cpu,
  Server,
  Layers,
  Terminal,
  Minimize2,
  Maximize2,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';

interface ArchitectureVisualizerPanelProps {
  projectName?: string;
}

export function ArchitectureVisualizerPanel({ projectName = 'My Project' }: ArchitectureVisualizerPanelProps) {
  return (
    <div className="w-full h-full flex flex-col bg-surface-container-lowest overflow-hidden">
      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* SECTION 2: SYSTEM TOPOLOGY DIAGRAM */}
        <div className="flex-1 p-6 relative overflow-auto grid place-items-center bg-background border-r border-white/10">
          <div className="relative w-full max-w-4xl h-[480px]">
            {/* Connecting Lines (Decorative SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {/* Client to API */}
              <path
                d="M 150 240 C 250 240, 250 150, 350 150"
                fill="none"
                stroke="#56d9d9"
                strokeDasharray="4 4"
                strokeWidth="2"
              />
              {/* API to Cache */}
              <path d="M 550 150 L 700 100" fill="none" stroke="rgba(223,222,220,0.2)" strokeWidth="2" />
              {/* API to DB */}
              <path d="M 550 150 L 700 360" fill="none" stroke="#56d9d9" strokeWidth="2" />
            </svg>

            {/* Client Node */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-48 border border-white/10 bg-surface-container-high p-4 z-10 offset-shadow">
              <div className="font-mono text-[10px] font-bold text-on-surface-variant mb-2 flex items-center gap-2 uppercase">
                <Server className="w-4 h-4 text-primary" /> Entry Point
              </div>
              <div className="font-heading text-sm font-bold text-on-surface">Client Web Apps</div>
            </div>

            {/* API Node */}
            <div className="absolute left-1/2 top-[150px] -translate-x-1/2 -translate-y-1/2 w-64 border border-primary bg-surface-container-high p-4 z-10 shadow-[4px_4px_0px_0px_rgba(0,172,172,0.2)]">
              <div className="font-mono text-[10px] font-bold text-primary mb-2 flex justify-between items-center">
                <div className="flex items-center gap-2 uppercase">
                  <Cpu className="w-4 h-4" /> API Monolith
                </div>
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
              <div className="font-mono text-xs font-bold text-on-surface mb-2">Express.js / Node</div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-surface-container-highest border border-white/10 font-mono text-[10px] text-on-surface-variant">REST</span>
                <span className="px-2 py-0.5 bg-surface-container-highest border border-white/10 font-mono text-[10px] text-on-surface-variant">GraphQL</span>
              </div>
            </div>

            {/* Cache Node */}
            <div className="absolute right-6 top-[100px] -translate-y-1/2 w-48 border border-white/10 bg-surface-container-high p-4 z-10 offset-shadow">
              <div className="font-mono text-[10px] font-bold text-on-surface-variant mb-2 flex items-center gap-2 uppercase">
                <HardDrive className="w-4 h-4 text-secondary" /> Cache Layer
              </div>
              <div className="font-heading text-sm font-bold text-on-surface">Redis In-Memory</div>
            </div>

            {/* DB Node */}
            <div className="absolute right-6 top-[360px] -translate-y-1/2 w-48 border border-primary bg-surface-container-high p-4 z-10 offset-shadow">
              <div className="font-mono text-[10px] font-bold text-primary mb-2 flex items-center gap-2 uppercase">
                <Database className="w-4 h-4 text-primary" /> Persistence
              </div>
              <div className="font-heading text-sm font-bold text-on-surface">PostgreSQL DB</div>
              <div className="mt-2 text-[10px] text-on-surface-variant font-mono">Active Connections: 42</div>
            </div>
          </div>
        </div>

        {/* SECTION 3: SYSTEM STACK LEGEND */}
        <div className="w-80 border-l border-white/10 bg-surface p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
          <h3 className="font-mono text-xs font-bold text-on-surface-variant tracking-widest border-b border-white/10 pb-2 uppercase">
            ACTIVE PACKAGES
          </h3>
          <div className="flex flex-col gap-4">
            <div className="border border-white/10 p-4 bg-surface-container-lowest">
              <div className="flex justify-between items-center mb-2">
                <div className="font-heading text-sm font-bold text-on-surface">Next.js</div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-surface-container-high text-on-surface-variant border border-white/10">v14.2.0</span>
              </div>
              <div className="font-mono text-xs text-on-surface-variant">React Framework</div>
            </div>

            <div className="border border-white/10 p-4 bg-surface-container-lowest">
              <div className="flex justify-between items-center mb-2">
                <div className="font-heading text-sm font-bold text-on-surface">Prisma ORM</div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-surface-container-high text-on-surface-variant border border-white/10">v5.10.0</span>
              </div>
              <div className="font-mono text-xs text-on-surface-variant">Next-gen Data ORM</div>
            </div>

            <div className="border border-primary p-4 bg-surface-container-lowest relative">
              <div className="absolute -left-1 top-4 bottom-4 w-1 bg-primary"></div>
              <div className="flex justify-between items-center mb-2">
                <div className="font-heading text-sm font-bold text-on-surface">Tailwind CSS</div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-primary text-background font-bold">v3.4.1</span>
              </div>
              <div className="font-mono text-xs text-on-surface-variant">Utility CSS Engine</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: DIAGNOSTIC LOGS */}
      <div className="h-44 border-t border-white/10 bg-[#1e1e1e] flex flex-col shrink-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-surface-container-high">
          <span className="font-mono text-xs font-bold text-on-surface-variant flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-primary" /> DIAGNOSTIC TERMINAL
          </span>
          <div className="flex gap-2 text-on-surface-variant">
            <Minimize2 className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
            <Maximize2 className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-on-surface-variant leading-relaxed">
          <div className="flex gap-3 mb-1"><span className="text-primary">[INFO]</span> <span>Initializing architectural scan...</span></div>
          <div className="flex gap-3 mb-1"><span className="text-primary">[INFO]</span> <span>Validating node connectivity (Client -&gt; API -&gt; DB)...</span></div>
          <div className="flex gap-3 mb-1"><span className="text-primary">[INFO]</span> <span>Checking latency metrics...</span></div>
          <div className="flex gap-3 mb-1"><span className="text-primary font-bold">[SUCCESS]</span> <span className="text-on-surface">Architecture compliance check passed. All nodes operational.</span></div>
        </div>
      </div>
    </div>
  );
}
