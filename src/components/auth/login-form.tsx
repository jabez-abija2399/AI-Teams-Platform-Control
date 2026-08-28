'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/config/constants';
import { GlassCard, NeonButton } from '@/packages/ui';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: ROUTES.projects,
      });

      if (!result || result.error || result.ok === false) {
        const status = (result as { status?: number } | undefined)?.status;
        if (status === 429) {
          setError('Too many login attempts. Please wait a few minutes and try again.');
        } else {
          setError('Invalid email or password.');
        }
        setLoading(false);
        return;
      }

      window.location.assign(result.url || ROUTES.projects);
    } catch {
      setError('Authentication failed. Please try again.');
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
        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Sign in to command your autonomous AI software company.
        </p>
      </div>

      {/* Glassmorphic Form Card */}
      <GlassCard className="p-8 border-white/10 shadow-2xl bg-surface-glass/90">
        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-danger/40 bg-danger/10 p-3.5 text-xs font-medium text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-white/70">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                id="login-email"
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

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-white/70">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              disabled={loading || !email.trim() || !password}
              className="w-full h-11 text-xs font-bold shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <span>Sign In to Mission Control</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </NeonButton>
          </div>
        </form>
      </GlassCard>

      <p className="mt-6 text-center text-sm text-white/50 lg:text-left">
        Don&apos;t have an account?{' '}
        <Link href={ROUTES.register} className="font-bold text-primary hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
