'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/config/constants';
import { GlassCard, NeonButton } from '@/packages/ui';

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email.trim(), password }),
      });

      const data = await res.json();

      if (res.status === 429 || data?.error?.code === 'RATE_LIMITED') {
        throw new Error(data?.error?.message || 'Too many signup attempts. Please wait and try again.');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Registration failed.');
      }

      setSuccess('Account created. Redirecting to sign in...');
      setTimeout(() => router.push(ROUTES.login), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-white">
      {/* Brand Header */}
      <div className="mb-6">
        <Link href={ROUTES.home} className="mb-4 inline-flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">{APP_NAME}</span>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white">Create your account</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Launch your autonomous AI software company in minutes.
        </p>
      </div>

      {/* Glassmorphic Form Card */}
      <GlassCard className="p-8 border-white/10 shadow-2xl bg-surface-glass/90">
        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-danger/40 bg-danger/10 p-3.5 text-xs font-medium text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-success/40 bg-success/10 p-3.5 text-xs font-medium text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="signup-name" className="text-xs font-bold uppercase tracking-wider text-white/70">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                id="signup-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full h-11 rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 backdrop-blur-md transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-email" className="text-xs font-bold uppercase tracking-wider text-white/70">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-11 rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 backdrop-blur-md transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-password" className="text-xs font-bold uppercase tracking-wider text-white/70">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                id="signup-password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full h-11 rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 backdrop-blur-md transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-confirm-password" className="text-xs font-bold uppercase tracking-wider text-white/70">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                id="signup-confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 backdrop-blur-md transition-all font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <NeonButton
              type="submit"
              variant="primary"
              isLoading={loading}
              disabled={loading || !email.trim() || !password || !confirmPassword}
              className="w-full h-11 text-xs font-bold shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                'Creating Account...'
              ) : (
                <>
                  <span>Create AI Company Account</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </NeonButton>
          </div>
        </form>
      </GlassCard>

      <p className="mt-6 text-center text-sm text-white/50 lg:text-left">
        Already have an account?{' '}
        <Link href={ROUTES.login} className="font-bold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
