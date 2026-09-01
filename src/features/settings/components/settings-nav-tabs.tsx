'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cpu, Server, Key, Shield, User } from 'lucide-react';

export function SettingsNavTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: '/dashboard/settings', label: 'AI Providers', icon: Cpu },
    { href: '/dashboard/settings/access', label: 'Workspace & Access', icon: Server },
    { href: '/dashboard/settings/security', label: 'Security & Audit', icon: Shield },
    { href: '/dashboard/settings/account', label: 'Account Profile', icon: User },
  ];

  return (
    <div className="flex items-center gap-0 border-b border-outline-variant/60 overflow-x-auto font-mono text-[11px] mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold transition-colors border-b-2 uppercase tracking-wider whitespace-nowrap ${
              active
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
