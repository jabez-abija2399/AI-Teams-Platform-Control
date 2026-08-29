'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Gift,
  KeyRound,
  Loader2,
  Shield,
  Trash2,
  Zap,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard, NeonButton, StatusBadge } from '@/packages/ui';
import {
  DEFAULT_FREE_PROVIDER_ID,
  isUserAiProviderId,
  type AiProviderCatalogEntry,
  type UserAiProviderId,
} from '@/features/ai-credentials/ai-provider-catalog';
import type { AiCredentialPublicStatus } from '@/features/ai-credentials/ai-credentials.types';

interface AiCredentialsFormProps {
  embedded?: boolean;
  onConfigured?: (status: AiCredentialPublicStatus) => void;
  className?: string;
}

/**
 * Ultra-Modern Cyber Void AI Credentials Configuration Suite.
 * Handles secure BYOK (Bring-Your-Own-Key) credentials for Google Gemini, Groq, OpenAI, Anthropic, and OpenRouter.
 */
export function AiCredentialsForm({ embedded = false, onConfigured, className }: AiCredentialsFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; model?: string; latencyMs?: number } | null>(null);
  const [removing, setRemoving] = useState(false);
  const [status, setStatus] = useState<AiCredentialPublicStatus | null>(null);
  const [providers, setProviders] = useState<AiProviderCatalogEntry[]>([]);
  const [provider, setProvider] = useState<UserAiProviderId>(DEFAULT_FREE_PROVIDER_ID);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => providers.find((p) => p.id === provider) ?? providers[0],
    [providers, provider],
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/ai-credentials', { credentials: 'same-origin', cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || 'Could not load AI settings');
      }
      setStatus(json.data.status);
      setProviders(json.data.providers ?? []);
      if (json.data.status?.provider && isUserAiProviderId(json.data.status.provider)) {
        setProvider(json.data.status.provider);
      } else {
        setProvider(DEFAULT_FREE_PROVIDER_ID);
      }
      if (json.data.status?.configured) {
        onConfigured?.(json.data.status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load AI settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTestConnection = async (explicitKey?: string) => {
    if (!selected || testing) return;
    setTesting(true);
    setTestResult(null);
    setError(null);

    const keyToTest = (explicitKey ?? apiKey).trim();

    if (!keyToTest && (!status?.configured || status?.provider !== selected.id)) {
      const msg = `Please enter your ${selected.name} API key in the field below before testing.`;
      setError(msg);
      toast.error('API Key Required', { description: msg });
      setTesting(false);
      return;
    }

    try {
      const res = await fetch('/api/settings/ai-credentials/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selected.id,
          apiKey: keyToTest || undefined,
          action: 'test',
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || 'Connection test failed');
      }

      setTestResult({
        success: true,
        message: json.data?.message || 'Connection verified successfully',
        model: json.data?.model,
        latencyMs: json.data?.latencyMs,
      });

      toast.success('Connection Successful', {
        description: `Connected to ${selected.name} · ${json.data?.latencyMs ?? 0}ms latency`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection test failed';
      setTestResult({ success: false, message });
      setError(message);
      toast.error('Connection Test Failed', { description: message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || saving) return;

    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setError('Please enter an API key');
      return;
    }

    setSaving(true);
    setError(null);
    setTestResult(null);

    try {
      const res = await fetch('/api/settings/ai-credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selected.id,
          apiKey: trimmedKey,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || 'Could not save API key');
      }

      setStatus(json.data.status);
      setApiKey('');
      setShowKey(false);
      onConfigured?.(json.data.status);

      toast.success('API Key Saved & Encrypted', {
        description: `${selected.name} configured. Ready to run projects.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save API key';
      setError(message);
      toast.error('Could not save API key', { description: message });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    setError(null);
    setTestResult(null);

    try {
      const res = await fetch('/api/settings/ai-credentials', {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || 'Could not remove API key');
      }

      setStatus({
        configured: false,
        provider: null,
        providerName: null,
        keyHint: null,
        defaultModel: null,
        updatedAt: null,
      });

      toast.success('API key removed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not remove API key';
      setError(message);
      toast.error('Could not remove API key', { description: message });
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <GlassCard className="flex items-center justify-center gap-3 py-16 text-sm text-white/50">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Loading AI credentials telemetry…</span>
      </GlassCard>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Information Header Card */}
      <GlassCard className="p-6 border-primary/20 bg-gradient-to-r from-surface-glass/80 to-primary/5">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/40 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            {embedded ? <Gift className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-base font-bold text-white tracking-tight">
              {embedded ? 'Connect Your AI Provider (BYOK)' : 'Bring Your Own Key (BYOK)'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              Your AI company calls LLM providers securely using your API key. Keys are encrypted at rest with AES-256-GCM and never exposed to client code.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Active Connected Status Card */}
      {status?.configured && (
        <GlassCard className="p-5 border-success/30 bg-success/5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20 text-success border border-success/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {status.providerName}
                <span className="ml-2 font-mono text-xs text-white/50">{status.keyHint}</span>
              </p>
              <p className="text-xs text-white/50">
                Model: <span className="font-medium text-white/80">{status.defaultModel ?? 'default'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={testing}
              onClick={() => void handleTestConnection()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-all"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Test Connection
            </button>
            <button
              type="button"
              disabled={removing}
              onClick={() => void handleRemove()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-danger border border-danger/30 bg-danger/10 hover:bg-danger/20 transition-all"
            >
              {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Remove
            </button>
          </div>
        </GlassCard>
      )}

      {/* Test Result Alert Banner */}
      {testResult && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-2xl border p-4 text-xs transition-all backdrop-blur-xl',
            testResult.success
              ? 'border-success/40 bg-success/10 text-success'
              : 'border-danger/40 bg-danger/10 text-danger',
          )}
        >
          {testResult.success ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div className="flex-1">
            <span className="font-bold">{testResult.success ? 'API Connection Verified' : 'Connection Test Failed'}</span>
            <p className="mt-0.5 leading-relaxed opacity-90">{testResult.message}</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-xs font-medium text-danger">
          {error}
        </div>
      )}

      {/* Main Credentials Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <GlassCard className="p-6 space-y-6 border-white/10 shadow-xl">
          {/* Provider Selection Grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-white/70">
              Select AI Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {providers.map((p) => {
                const isSelected = provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProvider(p.id);
                      setTestResult(null);
                    }}
                    className={cn(
                      'p-3.5 rounded-xl border text-left transition-all duration-200 backdrop-blur-md',
                      isSelected
                        ? 'border-primary bg-primary/20 glow-cyan ring-1 ring-primary'
                        : 'border-white/10 bg-surface-container-high hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{p.name}</span>
                      {p.pricing === 'free_tier' && (
                        <span className="rounded-full bg-success/20 text-success border border-success/30 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase">
                          Free
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/50 line-clamp-1">{p.defaultModel}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="api-key" className="text-xs font-bold uppercase tracking-wider text-white/70">
                {selected?.name} API Key
              </label>
              {selected?.docsUrl && (
                <a
                  href={selected.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  Get an API key
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selected?.keyPlaceholder ?? 'Enter API Key'}
                className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 backdrop-blur-md transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 text-white/40 hover:text-white transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security Guarantee Pill */}
          <div className="flex items-center gap-2 text-xs text-white/50 font-mono">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <span>Encrypted with AES-256-GCM. Stored in isolated database partition.</span>
          </div>

          {/* Save Action */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <NeonButton
              type="submit"
              variant="primary"
              isLoading={saving}
              disabled={saving || !apiKey.trim()}
              className="flex-1 h-11 text-xs font-bold"
            >
              Save & Activate Provider
            </NeonButton>
            <button
              type="button"
              disabled={testing || !apiKey.trim()}
              onClick={() => void handleTestConnection()}
              className="h-11 px-5 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-primary" />}
              Test Input Key
            </button>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}
