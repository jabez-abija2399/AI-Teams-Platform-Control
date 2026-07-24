'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Shield, LogOut, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    // Check active session or set default user info
    setUserInfo({
      name: 'Abija User',
      email: 'abi@gmail.com',
      role: 'Software Architect / Developer',
    });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full text-[11px] font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Active Session
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-sky-950 border-2 border-sky-600 flex items-center justify-center text-sky-400 font-bold text-xl shadow-lg">
            AU
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{userInfo?.name || 'User Profile'}</h1>
            <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 text-slate-500" />
              <span>{userInfo?.email || 'loading...'}</span>
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
            <span className="text-slate-400">Account Type</span>
            <span className="font-semibold text-slate-200">Developer Pro</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
            <span className="text-slate-400">Role</span>
            <span className="font-semibold text-sky-400">{userInfo?.role}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400">Security Standard</span>
            <span className="font-mono text-emerald-400 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Password Hashed
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Securely</span>
        </button>
      </div>
    </main>
  );
}
