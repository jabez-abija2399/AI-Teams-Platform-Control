'use client';

import React, { useState } from 'react';
import { FileText, Code, Sparkles, Terminal, Download, Eye, Search, Filter, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ArtifactItem {
  id: string;
  name: string;
  type: string;
  agent: string;
  status: 'READY' | 'IN_PROGRESS' | 'PENDING';
  size: string;
  updatedAt: string;
  description: string;
}

export function ArtifactsRegistry() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PRD' | 'ARCH' | 'DESIGN' | 'CODE'>('ALL');

  const artifacts: ArtifactItem[] = [
    {
      id: 'art-01',
      name: 'PRD_StudyMate_v1.md',
      type: 'PRD',
      agent: 'CEO Agent',
      status: 'READY',
      size: '24.8 KB',
      updatedAt: '2 hours ago',
      description: 'Product Requirements Document covering user personas, core features, and MVP acceptance criteria.',
    },
    {
      id: 'art-02',
      name: 'Arch_StudyMate_v1.json',
      type: 'ARCH',
      agent: 'Architect Agent',
      status: 'READY',
      size: '48.2 KB',
      updatedAt: '1.5 hours ago',
      description: 'System Architecture Specification defining database schemas, API routes, and microservice topology.',
    },
    {
      id: 'art-03',
      name: 'Design_System_StudyMate.css',
      type: 'DESIGN',
      agent: 'Designer Agent',
      status: 'IN_PROGRESS',
      size: '12.4 KB',
      updatedAt: 'Just now',
      description: 'Design System Guidelines & Design Tokens palette for component styling.',
    },
    {
      id: 'art-04',
      name: 'Source_Code_StudyMate.zip',
      type: 'CODE',
      agent: 'Developer Agent',
      status: 'PENDING',
      size: '--',
      updatedAt: 'Pending execution',
      description: 'Compiled Next.js application bundle and automated test suite.',
    },
  ];

  const filteredArtifacts = artifacts.filter((art) => {
    const matchesSearch = art.name.toLowerCase().includes(searchTerm.toLowerCase()) || art.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'ALL' || art.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-on-background p-6 md:p-8 max-w-7xl mx-auto w-full gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-primary font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>NEURAL MESH / ARTIFACTS REGISTRY</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-white">Core Artifacts</h1>
          <p className="font-sans text-xs text-on-surface-variant">
            Active specification documents and compiled outputs for current sprint cycle.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 bg-surface border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-primary">
            <Search className="w-3.5 h-3.5 text-on-surface-variant mr-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter artifacts..."
              className="w-full bg-transparent border-none text-white font-mono text-xs focus:outline-none placeholder:text-on-surface-variant/40"
            />
          </div>
          <div className="flex items-center bg-surface border border-white/10 rounded-lg p-1 font-mono text-xs">
            {(['ALL', 'PRD', 'ARCH', 'DESIGN', 'CODE'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  selectedFilter === filter ? 'bg-primary text-black font-bold' : 'text-on-surface-variant hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Artifacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredArtifacts.map((art) => (
          <div
            key={art.id}
            className={`bg-surface border p-6 rounded-xl flex flex-col justify-between transition-all ${
              art.status === 'IN_PROGRESS'
                ? 'border-primary/40 glow-border'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {art.type === 'PRD' && <FileText className="w-5 h-5 text-primary" />}
                  {art.type === 'ARCH' && <Code className="w-5 h-5 text-primary" />}
                  {art.type === 'DESIGN' && <Sparkles className="w-5 h-5 text-primary" />}
                  {art.type === 'CODE' && <Terminal className="w-5 h-5 text-on-surface-variant" />}
                  <div>
                    <h3 className="font-mono text-sm font-bold text-white leading-tight">{art.name}</h3>
                    <span className="font-mono text-[10px] text-on-surface-variant">{art.agent}</span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 font-mono text-[10px] font-bold rounded uppercase ${
                    art.status === 'READY'
                      ? 'bg-surface-container-high text-primary border border-primary/30'
                      : art.status === 'IN_PROGRESS'
                      ? 'bg-primary/10 text-primary border border-primary glow-cyan'
                      : 'bg-surface-container-high text-on-surface-variant opacity-50 border border-white/10'
                  }`}
                >
                  {art.status}
                </span>
              </div>

              <p className="font-sans text-xs text-on-surface-variant mb-4 leading-relaxed">
                {art.description}
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between font-mono text-[11px] text-on-surface-variant">
              <span>{art.size} • Updated {art.updatedAt}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="View Artifact"
                  className="p-1.5 rounded border border-white/10 hover:border-primary hover:text-white transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {art.status === 'READY' && (
                  <button
                    type="button"
                    aria-label="Download Artifact"
                    className="p-1.5 rounded border border-primary text-primary hover:bg-primary hover:text-black transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
