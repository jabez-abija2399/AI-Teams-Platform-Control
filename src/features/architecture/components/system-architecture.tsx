'use client';

import React, { useState } from 'react';
import { Network, Server, Database, Laptop, ShieldCheck, Activity, Cpu, ArrowRight } from 'lucide-react';

export function SystemArchitecture() {
  const [selectedNode, setSelectedNode] = useState<'CLIENT' | 'APP_SERVICES' | 'DATABASE'>('APP_SERVICES');

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-on-background p-6 md:p-8 max-w-7xl mx-auto w-full gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-primary font-bold mb-1">
            <Network className="w-4 h-4" />
            <span>SYSTEM TOPOLOGY / ARCHITECTURE GRAPH</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-white">Microservices Graph</h1>
          <p className="font-sans text-xs text-on-surface-variant">
            Interactive node inspection for client entrypoints, API gateways, and vector databases.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs bg-surface border border-white/10 px-3 py-1.5 rounded-lg text-primary font-bold">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>GRAPH STATUS: STABLE</span>
        </div>
      </div>

      {/* Interactive Topology Graph Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Diagram Area (Takes 2 cols) */}
        <div className="lg:col-span-2 bg-surface border border-white/10 rounded-xl p-8 min-h-[380px] flex items-center justify-center relative overflow-hidden">
          {/* Subtle Dot Grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Node Graph Container */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8 w-full max-w-2xl font-mono text-xs">
            {/* Client Node */}
            <button
              type="button"
              onClick={() => setSelectedNode('CLIENT')}
              className={`p-6 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                selectedNode === 'CLIENT'
                  ? 'border-primary bg-primary/10 text-primary glow-border'
                  : 'border-white/10 bg-background text-on-surface-variant hover:border-white/30'
              }`}
            >
              <Laptop className="w-8 h-8" />
              <span className="font-bold">Client Layer</span>
              <span className="text-[10px] opacity-70">Browser / Mobile</span>
            </button>

            {/* Connecting Arrow */}
            <div className="flex items-center gap-1 text-primary animate-pulse">
              <div className="w-12 h-0.5 bg-primary" />
              <ArrowRight className="w-4 h-4 -ml-2" />
            </div>

            {/* App Services Node */}
            <button
              type="button"
              onClick={() => setSelectedNode('APP_SERVICES')}
              className={`p-6 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                selectedNode === 'APP_SERVICES'
                  ? 'border-primary bg-primary/10 text-primary glow-border'
                  : 'border-white/10 bg-background text-on-surface-variant hover:border-white/30'
              }`}
            >
              <Server className="w-8 h-8" />
              <span className="font-bold">App Services</span>
              <span className="text-[10px] opacity-70">API Gateway</span>
            </button>

            {/* Connecting Arrow */}
            <div className="flex items-center gap-1 text-primary animate-pulse">
              <div className="w-12 h-0.5 bg-primary" />
              <ArrowRight className="w-4 h-4 -ml-2" />
            </div>

            {/* Database Node */}
            <button
              type="button"
              onClick={() => setSelectedNode('DATABASE')}
              className={`p-6 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                selectedNode === 'DATABASE'
                  ? 'border-primary bg-primary/10 text-primary glow-border'
                  : 'border-white/10 bg-background text-on-surface-variant hover:border-white/30'
              }`}
            >
              <Database className="w-8 h-8" />
              <span className="font-bold">Data Store</span>
              <span className="text-[10px] opacity-70">PostgreSQL / Vector</span>
            </button>
          </div>
        </div>

        {/* Selected Node Inspector (1 col) */}
        <div className="bg-surface border border-white/10 rounded-xl p-6 flex flex-col justify-between font-mono text-xs">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-sans text-sm font-bold text-white uppercase">NODE INSPECTOR</h3>
              <span className="text-[10px] text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded font-bold">
                {selectedNode}
              </span>
            </div>

            {selectedNode === 'CLIENT' && (
              <div className="space-y-3">
                <p className="text-on-surface-variant font-sans text-xs">
                  Web and mobile user entrypoints rendering Next.js App Router layout and React Server Components.
                </p>
                <div className="p-3 bg-background border border-white/10 rounded space-y-1">
                  <div className="text-white font-bold">Latency: 12ms</div>
                  <div className="text-on-surface-variant text-[10px]">Protocol: HTTPS / WebSockets</div>
                </div>
              </div>
            )}

            {selectedNode === 'APP_SERVICES' && (
              <div className="space-y-3">
                <p className="text-on-surface-variant font-sans text-xs">
                  Autonomous agent orchestration engine managing task queues, LLM prompt gateways, and BYOK vault.
                </p>
                <div className="p-3 bg-background border border-white/10 rounded space-y-1">
                  <div className="text-white font-bold">Cluster Health: 100%</div>
                  <div className="text-on-surface-variant text-[10px]">Worker Threads: 4 Active</div>
                </div>
              </div>
            )}

            {selectedNode === 'DATABASE' && (
              <div className="space-y-3">
                <p className="text-on-surface-variant font-sans text-xs">
                  Relational PostgreSQL database coupled with Vector Embeddings for project context memory retention.
                </p>
                <div className="p-3 bg-background border border-white/10 rounded space-y-1">
                  <div className="text-white font-bold">Storage Used: 1.2 GB</div>
                  <div className="text-on-surface-variant text-[10px]">Vault Encryption: AES-256</div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-on-surface-variant">
            <span>LAST INSPECTION: NOW</span>
            <span className="text-primary font-bold">HEALTHY</span>
          </div>
        </div>
      </div>
    </div>
  );
}
