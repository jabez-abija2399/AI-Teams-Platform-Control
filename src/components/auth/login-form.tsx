'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { AlertCircle, Eye, EyeOff, Key, Loader2, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { APP_NAME, ROUTES } from '@/config/constants';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BYOK Drawer toggling
  const [byokOpen, setByokOpen] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
        setError('Invalid email or password.');
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

      window.location.assign(result.url || ROUTES.projects);
    } catch {
      setError('Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Form Title & Subtitle */}
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-widest">
          WELCOME BACK
        </span>
        <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-white">
          Sign in to {APP_NAME}
        </h2>
      </div>

      {/* Error notification banner */}
      {error && (
        <div className="flex items-center gap-2.5 border border-danger/40 bg-danger/10 p-3.5 text-xs font-semibold text-danger rounded-xl">
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-background border border-white/10 text-white font-mono text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/40"
          />
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="font-mono text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <a href="#" className="font-mono text-xs text-on-surface-variant hover:text-primary transition-colors">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full bg-primary text-black font-mono text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-transparent hover:text-primary border border-primary transition-all duration-200 uppercase tracking-wider glow-cyan"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
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
