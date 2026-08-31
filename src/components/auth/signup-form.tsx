'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/config/constants';

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setSuccess(null);

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

  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getPasswordStrength();

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Form Title & Subtitle */}
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-white">
          Create Account
        </h2>
        <p className="font-sans text-xs text-on-surface-variant">
          Configure your account to begin building with AI.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2.5 border border-danger/40 bg-danger/10 p-3.5 text-xs font-semibold text-danger rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2.5 border border-success/40 bg-success/10 p-3.5 text-xs font-semibold text-success rounded-xl">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Full Name */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="signup-name">
            FULL_NAME
          </label>
          <input
            id="signup-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full bg-background border border-white/10 text-white font-mono text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/40"
          />
        </div>

        {/* Email Address */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="signup-email">
            EMAIL_ADDRESS
          </label>
          <input
            id="signup-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full bg-background border border-white/10 text-white font-mono text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/40"
          />
        </div>

        {/* Secure Key (Password) */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="signup-password">
            SECURE_KEY
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-background border border-white/10 text-white font-mono text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/40 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength Bar */}
          <div className="flex gap-1 mt-1">
            <div className={`h-1 w-1/3 rounded-full transition-all ${strength >= 1 ? 'bg-primary' : 'bg-white/10'}`} />
            <div className={`h-1 w-1/3 rounded-full transition-all ${strength >= 2 ? 'bg-primary' : 'bg-white/10'}`} />
            <div className={`h-1 w-1/3 rounded-full transition-all ${strength >= 3 ? 'bg-primary' : 'bg-white/10'}`} />
          </div>
        </div>

        {/* Primary CTA Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full bg-primary text-black font-mono text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-transparent hover:text-primary border border-primary transition-all duration-200 uppercase tracking-wider glow-cyan"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 w-full my-1">
        <div className="h-px flex-1 bg-white/10" />
        <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
          Auth_Providers
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Social Auth Buttons */}
      <div className="flex flex-col gap-2.5 font-mono text-xs">
        <button
          type="button"
          className="w-full bg-surface border border-white/10 hover:border-primary py-2.5 rounded-xl flex items-center justify-center gap-3 text-white transition-colors"
        >
          <span>Continue with Google</span>
        </button>
        <button
          type="button"
          className="w-full bg-surface border border-white/10 hover:border-primary py-2.5 rounded-xl flex items-center justify-center gap-3 text-white transition-colors"
        >
          <span>Continue with GitHub</span>
        </button>
      </div>

      {/* Footer Redirect */}
      <div className="text-center mt-2">
        <span className="font-sans text-xs text-on-surface-variant">Already have an account? </span>
        <Link
          href={ROUTES.login}
          className="font-mono text-xs font-bold text-primary border-b border-primary hover:text-white transition-colors pb-0.5"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
