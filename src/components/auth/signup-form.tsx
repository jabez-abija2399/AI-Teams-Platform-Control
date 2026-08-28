'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/config/constants';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const fieldClass =
  'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-xl border border-border/80 bg-background py-1 pl-10 pr-3 text-sm outline-none transition-shadow focus-visible:ring-3';

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
    <div className="w-full">
      <div className="mb-8">
        <Link href={ROUTES.home} className="mb-6 inline-flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-heading text-xl font-semibold tracking-tight">{APP_NAME}</span>
        </Link>
        <h1 className="font-heading mt-4 text-3xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Launch your AI software company in minutes.
        </p>
      </div>

      <div className="rounded-2xl border border-border/80 glass-card p-7 shadow-xl">
        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          <div className="space-y-2">
            <label htmlFor="signup-name" className="text-sm font-medium">
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="signup-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-email" className="text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="signup-password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-confirm" className="text-sm font-medium">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="signup-confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={fieldClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim() || !password || !confirmPassword}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'group mt-2 h-11 w-full rounded-xl text-sm shadow-sm',
            )}
          >
            {loading ? 'Creating account...' : 'Create account'}
            {!loading && (
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground lg:text-left">
        Already have an account?{' '}
        <Link href={ROUTES.login} className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
