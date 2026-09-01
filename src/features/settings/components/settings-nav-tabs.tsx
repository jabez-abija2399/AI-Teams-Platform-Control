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
    <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto font-mono text-xs mb-8 pb-px">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold transition-all border-b-2 uppercase tracking-wider whitespace-nowrap ${
              active
                ? 'border-primary text-primary bg-primary/10'
                : 'border-transparent text-on-surface-variant hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
