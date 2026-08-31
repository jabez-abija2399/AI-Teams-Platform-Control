'use client';

import React, { useState } from 'react';
import { Shield, UserPlus, Trash2, Key, Check, Server } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Developer' | 'Viewer';
  status: 'Active' | 'Invited';
}

export function WorkspaceAccessSettings() {
  const [workspaceName, setWorkspaceName] = useState('Primary HibirDev Workspace');
  const [defaultProvider, setDefaultProvider] = useState('openai');

  const [members, setMembers] = useState<Member[]>([
    {
      id: 'mem-1',
      name: 'System Owner',
      email: 'admin@hibirdev.ai',
      role: 'Owner',
      status: 'Active',
    },
    {
      id: 'mem-2',
      name: 'Lead Engineer',
      email: 'lead.dev@hibirdev.ai',
      role: 'Admin',
      status: 'Active',
    },
    {
      id: 'mem-3',
      name: 'Product Designer',
      email: 'designer@hibirdev.ai',
      role: 'Developer',
      status: 'Invited',
    },
  ]);

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Workspace configuration saved successfully!');
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast.success('Member access revoked.');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-on-background p-6 md:p-10 max-w-7xl mx-auto w-full gap-8">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-2">
          <span>WORKSPACE</span>
          <span className="opacity-40">/</span>
          <span className="text-primary font-bold">ACCESS CONTROL</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-white mb-1">Workspace Configuration</h1>
        <p className="font-sans text-xs text-on-surface-variant max-w-2xl">
          Manage workspace identity, fallback operational parameters, and member role-based access controls.
        </p>
      </div>

      {/* Workspace Details Form */}
      <section className="bg-surface border border-white/10 p-6 rounded-xl space-y-6 font-mono text-xs">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          <span>Workspace Defaults</span>
        </h2>

        <form onSubmit={handleSaveWorkspace} className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <label htmlFor="ws-name" className="text-white font-bold block">
              WORKSPACE NAME
            </label>
            <input
              id="ws-name"
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full bg-background border border-white/10 focus:border-primary text-white p-3 rounded font-mono text-xs outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="def-provider" className="text-white font-bold block">
              DEFAULT FALLBACK PROVIDER
            </label>
            <select
              id="def-provider"
              value={defaultProvider}
              onChange={(e) => setDefaultProvider(e.target.value)}
              className="w-full bg-background border border-white/10 focus:border-primary text-white p-3 rounded font-mono text-xs outline-none"
            >
              <option value="openai">OpenAI (gpt-4o)</option>
              <option value="anthropic">Anthropic (claude-3-5-sonnet)</option>
              <option value="groq">Groq (llama-3.3-70b)</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-primary text-black font-bold px-6 py-2.5 rounded hover:bg-primary-container transition-colors uppercase tracking-wider glow-cyan"
          >
            Save Configurations
          </button>
        </form>
      </section>

      {/* Access Management Table */}
      <section className="bg-surface border border-white/10 rounded-xl overflow-hidden font-mono text-xs">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="font-sans text-sm font-bold text-white uppercase">Access Management</h2>
            <p className="font-sans text-xs text-on-surface-variant">
              Team members and assigned RBAC permission roles.
            </p>
          </div>
          <button
            type="button"
            className="bg-primary/10 border border-primary text-primary font-bold px-4 py-2 rounded hover:bg-primary/20 transition-colors uppercase tracking-wider flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background border-b border-white/10 text-on-surface-variant uppercase text-[10px]">
                <th className="p-4">Member</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {members.map((mem) => (
                <tr key={mem.id} className="hover:bg-background/50 transition-colors">
                  <td className="p-4">
                    <div>
                      <span className="font-bold text-white block">{mem.name}</span>
                      <span className="text-[11px] text-on-surface-variant">{mem.email}</span>
                    </div>
                  </td>
                  <td className="p-4 text-primary font-bold">{mem.role}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        mem.status === 'Active'
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'bg-surface-container-high text-on-surface-variant border border-white/10'
                      }`}
                    >
                      {mem.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {mem.role !== 'Owner' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(mem.id)}
                        className="text-on-surface-variant hover:text-danger p-1"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
