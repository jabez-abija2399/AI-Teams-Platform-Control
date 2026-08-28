'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/config/constants';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const fieldClass =
  'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-xl border border-border/80 bg-background py-1 pl-10 pr-3 text-sm outline-none transition-shadow focus-visible:ring-3';

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
        // Auth.js client may surface rate-limit as CredentialsSignin / generic error
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
    <div className="w-full">
      <div className="mb-8">
        <Link href={ROUTES.home} className="mb-6 inline-flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-heading text-xl font-semibold tracking-tight">{APP_NAME}</span>
        </Link>
        <h1 className="font-heading mt-4 text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sign in to continue building with your AI company.
        </p>
      </div>

      <div className="rounded-2xl border border-border/80 glass-card p-7 shadow-xl">
        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="login-email"
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
            <label htmlFor="login-password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={fieldClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'group mt-2 h-11 w-full rounded-xl text-sm shadow-sm',
            )}
          >
            {loading ? 'Signing in...' : 'Sign in to workspace'}
            {!loading && (
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground lg:text-left">
        Don&apos;t have an account?{' '}
        <Link href={ROUTES.register} className="font-semibold text-primary hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
