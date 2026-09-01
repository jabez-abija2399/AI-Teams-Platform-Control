'use client';

import React from 'react';
import { Shield, Key, Lock, Activity, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { SettingsNavTabs } from './settings-nav-tabs';

export function SecuritySettings() {
  return (
    <div className="flex-1 flex flex-col h-full bg-background text-on-background p-6 md:p-10 max-w-7xl mx-auto w-full gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-2">
          <span>WORKSPACE</span>
          <span className="opacity-40">/</span>
          <span className="text-primary font-bold">SECURITY</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-white mb-1">Security & Audit Log</h1>
        <p className="font-sans text-xs text-on-surface-variant">
          Manage zero-knowledge BYOK credentials, session tokens, and security activity events.
        </p>
      </div>

      <SettingsNavTabs />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
        {/* Security Controls */}
        <section className="bg-surface border border-white/10 p-6 rounded-xl space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Zero-Knowledge Encryption</span>
          </h2>

          <div className="space-y-4 text-on-surface-variant">
            <div className="p-4 bg-background border border-white/10 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">BYOK Key Vault</span>
                <span className="text-[11px] text-on-surface-variant">AES-256 GCM client-side encryption</span>
              </div>
              <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/30 rounded font-bold text-[10px] uppercase">
                ACTIVE
              </span>
            </div>

            <div className="p-4 bg-background border border-white/10 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Session Token Expiry</span>
                <span className="text-[11px] text-on-surface-variant">Strict 24-hour rotating JWT</span>
              </div>
              <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/30 rounded font-bold text-[10px] uppercase">
                ENFORCED
              </span>
            </div>
          </div>
        </section>

        {/* Security Audit Activity Log */}
        <section className="bg-surface border border-white/10 p-6 rounded-xl space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span>Security Audit Log</span>
          </h2>

          <div className="space-y-3">
            <div className="p-3 bg-background border border-white/10 rounded flex justify-between items-center text-[11px]">
              <div>
                <span className="text-white font-bold block">OpenAI API Key verified</span>
                <span className="text-on-surface-variant text-[10px]">IP: 192.168.1.42 • Session 0x9f3A</span>
              </div>
              <span className="text-on-surface-variant">2m ago</span>
            </div>

            <div className="p-3 bg-background border border-white/10 rounded flex justify-between items-center text-[11px]">
              <div>
                <span className="text-white font-bold block">Workspace Owner login</span>
                <span className="text-on-surface-variant text-[10px]">2FA Verification passed</span>
              </div>
              <span className="text-on-surface-variant">1h ago</span>
            </div>

            <div className="p-3 bg-background border border-white/10 rounded flex justify-between items-center text-[11px]">
              <div>
                <span className="text-white font-bold block">New Developer Member invited</span>
                <span className="text-on-surface-variant text-[10px]">Role: Developer</span>
              </div>
              <span className="text-on-surface-variant">3h ago</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
