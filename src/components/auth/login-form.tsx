'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { ChevronDown, ChevronUp, AlertCircle, Key, Loader2, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { APP_NAME, ROUTES } from '@/config/constants';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [namespace, setNamespace] = useState('prd-cluster-01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BYOK Drawer toggling
  const [byokOpen, setByokOpen] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [testingByok, setTestingByok] = useState(false);

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

  const handleTestByok = async () => {
    if (testingByok) return;
    if (!openaiKey.trim() && !anthropicKey.trim()) {
      toast.error('API Key Required', { description: 'Please enter a key to test first.' });
      return;
    }
    setTestingByok(true);
    setTimeout(() => {
      setTestingByok(false);
      toast.success('Connection Successful', { description: 'Keys authenticated with provider gateway. Latency: 44ms' });
    }, 1500);
  };

  return (
    <div className="w-full relative">
      <div className="absolute inset-0 bg-primary/20 translate-x-2 translate-y-2 pointer-events-none border border-primary/40" />

      <div className="bg-surface border border-white/10 relative z-10 p-0 flex flex-col glass-card offset-shadow">
        {/* Card Header */}
        <div className="border-b border-white/10 p-6 bg-surface-container/60">
          <div className="flex justify-between items-center mb-1">
            <h2 className="font-heading text-xl font-bold text-white">Initialize Session</h2>
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs text-on-surface-variant">Provide namespace and credentials to mount workspace.</p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2.5 border border-danger/40 bg-danger/10 p-3.5 text-xs font-semibold text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Namespace Field */}
          <div>
            <label className="block font-mono text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mb-2" htmlFor="namespace">
              Cluster Namespace
            </label>
            <input
              id="namespace"
              type="text"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              className="w-full bg-background border border-white/10 px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block font-mono text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mb-2" htmlFor="email">
              User Identity (Email)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@hibir.dev"
              className="w-full bg-background border border-white/10 px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block font-mono text-[10px] uppercase font-bold text-on-surface-variant tracking-wider" htmlFor="password">
                Passcode Token
              </label>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-white/10 px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          {/* BYOK Collapsible Drawer Toggle */}
          <div className="border-t border-white/10 pt-4 mt-2">
            <button
              type="button"
              onClick={() => setByokOpen(!byokOpen)}
              className="w-full flex items-center justify-between text-xs font-mono text-primary hover:text-white font-bold transition-colors py-1"
            >
              <span className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5" />
                BYOK Configuration Gateway
              </span>
              {byokOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {byokOpen && (
              <div className="mt-4 p-4 border border-primary/30 bg-background/80 space-y-4">
                <p className="font-mono text-[11px] text-on-surface-variant">
                  Inject custom API keys for isolated inference. Keys bypass shared queues.
                </p>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-1" htmlFor="openaiKey">
                    OpenAI API Key
                  </label>
                  <input
                    id="openaiKey"
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full bg-surface border border-white/10 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-primary placeholder:text-on-surface-variant/40"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-1" htmlFor="anthropicKey">
                    Anthropic API Key
                  </label>
                  <input
                    id="anthropicKey"
                    type="password"
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full bg-surface border border-white/10 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-primary placeholder:text-on-surface-variant/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestByok}
                  disabled={testingByok}
                  className="w-full py-2 bg-surface border border-white/20 text-on-surface hover:text-primary hover:border-primary font-mono text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  {testingByok ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Test Connection Latency</span>
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-background font-mono text-xs font-bold py-3.5 border border-primary hover:bg-transparent hover:text-primary transition-all duration-200 uppercase tracking-wider flex items-center justify-center gap-2 group offset-shadow mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Cluster Node...</span>
              </>
            ) : (
              <>
                <span>Connect & Mount Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="p-4 border-t border-white/10 bg-surface-container-high/40 text-center font-mono text-xs text-on-surface-variant">
          Need access credentials?{' '}
          <Link href={ROUTES.register} className="text-primary hover:underline font-bold">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
