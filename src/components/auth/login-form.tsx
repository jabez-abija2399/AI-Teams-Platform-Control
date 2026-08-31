'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { AlertCircle, Eye, EyeOff, Key, Loader2, ArrowRight, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/config/constants';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);

  // BYOK Drawer toggling
  const [byokOpen, setByokOpen] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading || authorized) return;

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
        setError('Incorrect Credentials provided.');
        setLoading(false);
        return;
      }

      if (openaiKey.trim() || anthropicKey.trim()) {
        try {
          await fetch('/api/settings/ai-credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: openaiKey.trim() ? 'openai' : 'anthropic',
              apiKey: openaiKey.trim() ? openaiKey.trim() : anthropicKey.trim(),
            }),
          });
        } catch (err) {
          console.error('Failed to automatically store BYOK keys:', err);
        }
      }

      setLoading(false);
      setAuthorized(true);
      setTimeout(() => {
        window.location.assign(result.url || ROUTES.projects);
      }, 800);
    } catch {
      setError('Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  // State 04: Authorized / Success View
  if (authorized) {
    return (
      <div className="w-full flex flex-col items-center justify-center text-center gap-6 py-8 relative">
        <div className="w-14 h-14 rounded-xl bg-primary/10 border-2 border-primary flex items-center justify-center text-primary shadow-[0_0_20px_rgba(0,172,172,0.4)]">
          <Check className="w-7 h-7" />
        </div>
        <div>
          <h3 className="font-heading text-2xl font-extrabold text-white mb-2">
            Successfully Authenticated
          </h3>
          <span className="font-mono text-xs text-primary bg-primary/10 border border-primary/30 px-3 py-1 rounded font-bold uppercase tracking-wider">
            SESSION_TOKEN_GENERATED
          </span>
        </div>
        <p className="font-mono text-xs text-on-surface-variant animate-pulse">
          Redirecting to workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 relative">
      {/* Top Indeterminate Loading Bar during Processing */}
      {loading && (
        <div className="absolute -top-6 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden rounded-full">
          <div className="h-full bg-primary animate-pulse w-full" />
        </div>
      )}

      {/* Form Title & Subtitle */}
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-widest">
          WELCOME BACK
        </span>
        <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-white">
          Sign in to {APP_NAME}
        </h2>
        <p className="font-mono text-xs text-on-surface-variant">
          Authenticate to access the engineering platform.
        </p>
      </div>

      {/* Error notification banner */}
      {error && (
        <div className="flex items-center gap-2.5 border border-danger bg-danger/10 p-3.5 text-xs font-semibold text-danger rounded-xl font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Email Input */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="architect@hibirdev.ai"
            className={`w-full bg-background border text-white font-mono text-xs px-4 py-3 rounded-xl focus:outline-none transition-colors placeholder:text-on-surface-variant/40 ${
              error ? 'border-danger focus:border-danger' : 'border-white/10 focus:border-primary focus:ring-1 focus:ring-primary'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="font-mono text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <a href="#" className="font-mono text-xs text-primary hover:underline">
              Reset
            </a>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className={`w-full bg-background border text-white font-mono text-xs px-4 py-3 rounded-xl focus:outline-none transition-colors placeholder:text-on-surface-variant/40 pr-10 ${
                error ? 'border-danger focus:border-danger' : 'border-white/10 focus:border-primary focus:ring-1 focus:ring-primary'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        </div>

        {/* Collapsible BYOK Key Drawer */}
        <div className="border border-white/10 rounded-xl bg-surface-container-high/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setByokOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-mono font-bold text-on-surface-variant hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-primary" />
              <span>Optional: Custom Provider Key (BYOK)</span>
            </div>
            {byokOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {byokOpen && (
            <div className="p-4 border-t border-white/10 space-y-3 font-mono text-xs bg-background">
              <div>
                <label className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full bg-surface border border-white/10 px-3 py-2 text-xs text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                  Anthropic API Key
                </label>
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-surface border border-white/10 px-3 py-2 text-xs text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA Button with 4 State Styles */}
        <button
          type="submit"
          disabled={loading}
          className={`mt-2 w-full font-mono text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 border transition-all duration-200 uppercase tracking-wider ${
            error
              ? 'bg-surface text-white border-danger hover:bg-danger/10'
              : 'bg-primary text-black border-primary hover:bg-transparent hover:text-primary glow-cyan'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Signing In...</span>
            </>
          ) : error ? (
            <>
              <span>Retry Authentication</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Authenticate</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Redirect */}
      <div className="text-center">
        <span className="font-sans text-xs text-on-surface-variant">Don't have an account? </span>
        <Link
          href={ROUTES.register}
          className="font-mono text-xs font-bold text-white border-b border-white/30 hover:text-primary hover:border-primary transition-colors pb-0.5"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
