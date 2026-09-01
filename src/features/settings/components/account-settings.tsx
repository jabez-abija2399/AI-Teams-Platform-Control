'use client';

import React, { useState } from 'react';
import { User, Mail, Lock, Check } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsNavTabs } from './settings-nav-tabs';

interface AccountSettingsProps {
  userName?: string | null;
  userEmail?: string | null;
}

export function AccountSettings({ userName = 'System Creator', userEmail = 'admin@hibirdev.ai' }: AccountSettingsProps) {
  const [name, setName] = useState(userName || 'System Creator');
  const [email, setEmail] = useState(userEmail || 'admin@hibirdev.ai');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Account profile updated successfully!');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-on-background p-6 md:p-10 max-w-7xl mx-auto w-full gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-2">
          <span>SETTINGS</span>
          <span className="opacity-40">/</span>
          <span className="text-primary font-bold">ACCOUNT</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-white mb-1">Account Profile</h1>
        <p className="font-sans text-xs text-on-surface-variant">
          Manage your personal profile details, notification preferences, and account security.
        </p>
      </div>

      <SettingsNavTabs />

      <section className="bg-surface border border-white/10 p-6 rounded-xl space-y-6 max-w-xl font-mono text-xs">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <span>Profile Information</span>
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="user-name" className="text-white font-bold block">
              FULL NAME
            </label>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-white/10 focus:border-primary text-white p-3 rounded font-mono text-xs outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="user-email" className="text-white font-bold block">
              EMAIL ADDRESS
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-white/10 focus:border-primary text-white p-3 rounded font-mono text-xs outline-none"
            />
          </div>

          <button
            type="submit"
            className="bg-primary text-black font-bold px-6 py-2.5 rounded hover:bg-primary-container transition-colors uppercase tracking-wider glow-cyan"
          >
            Update Profile
          </button>
        </form>
      </section>
    </div>
  );
}
