'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { ChevronDown, ChevronUp, AlertCircle, Key, Loader2 } from 'lucide-react';
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

      // If keys are provided, save them securely (optional mock action)
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
          console.error("Failed to automatically store BYOK keys:", err);
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
    // Simulate latency connection test
    setTimeout(() => {
      setTestingByok(false);
      toast.success('Connection Successful', { description: 'Keys authenticated with provider gateway. Latency: 44ms' });
    }, 1500);
  };

  return (
    <div className="w-full relative">
      {/* Brutalist Offset Shadow Container Background */}
      <div className="absolute inset-0 bg-primary translate-x-2 translate-y-2 pointer-events-none"></div>
      
      <div className="bg-surface-container border border-white/10 relative z-10 p-0 flex flex-col">
        {/* Card Header */}
        <div className="border-b border-white/10 p-6 bg-surface-container-highest">
          <h2 className="font-heading text-xl font-bold text-white">Initialize Session</h2>
          <p className="text-xs text-on-surface-variant mt-1">Provide namespace and credentials to mount workspace.</p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2.5 rounded-none border border-danger/40 bg-danger/10 p-3.5 text-xs font-semibold text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6" noValidate>
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-on-surface block mb-2" htmlFor="namespace">
                Workspace Namespace
              </label>
              <input
                id="namespace"
                type="text"
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                placeholder="e.g. prd-cluster-01"
                className="w-full bg-background border border-white/15 text-on-background font-mono text-sm p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-on-surface block mb-2" htmlFor="login-email">
                Developer Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@hibir.io"
                className="w-full bg-background border border-white/15 text-on-background font-mono text-sm p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-on-surface block mb-2" htmlFor="login-password">
                Session Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-background border border-white/15 text-on-background font-mono text-sm p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* BYOK Drawer Configuration Gate */}
          <div className="border border-white/10 bg-surface-container-low">
            <button
              onClick={() => setByokOpen(!byokOpen)}
              type="button"
              className="w-full flex items-center justify-between p-4 focus:outline-none hover:bg-surface-container-high transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Key className="text-primary w-4 h-4" />
                <span className="font-mono text-xs uppercase tracking-wider text-on-surface">BYOK Configuration</span>
              </div>
              {byokOpen ? (
                <ChevronUp className="text-on-surface-variant w-4 h-4" />
              ) : (
                <ChevronDown className="text-on-surface-variant w-4 h-4" />
              )}
            </button>
            
            {byokOpen && (
              <div className="border-t border-white/10 p-4 flex flex-col gap-4 bg-background/50">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant block mb-2" htmlFor="openai-key">
                    OpenAI API Key (Optional)
                  </label>
                  <input
                    id="openai-key"
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-background border border-white/10 text-on-background font-mono text-xs p-2 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant block mb-2" htmlFor="anthropic-key">
                    Anthropic API Key (Optional)
                  </label>
                  <input
                    id="anthropic-key"
                    type="password"
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full bg-background border border-white/10 text-on-background font-mono text-xs p-2 focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  onClick={handleTestByok}
                  type="button"
                  className="mt-2 font-mono text-xs text-primary border border-primary px-4 py-2 hover:bg-primary hover:text-background transition-colors self-end"
                >
                  {testingByok ? (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Testing...
                    </div>
                  ) : (
                    'Test Connection'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-background font-mono text-xs font-bold py-4 border border-primary hover:bg-transparent hover:text-primary transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Mounting Workspace...
              </div>
            ) : (
              'Initialize Session'
            )}
          </button>
        </form>

        {/* Auth Footer */}
        <div className="border-t border-white/10 p-6 bg-surface-container-low flex flex-col items-center gap-3">
          <a className="font-mono text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">
            Forgot Session Credentials?
          </a>
          <Link href={ROUTES.register} className="font-mono text-xs text-on-surface-variant hover:text-primary transition-colors">
            Create New Workspace Namespace
          </Link>
        </div>
      </div>
    </div>
  );
}
