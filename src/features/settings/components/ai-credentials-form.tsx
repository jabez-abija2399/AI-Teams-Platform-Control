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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';
import {
  DEFAULT_FREE_PROVIDER_ID,
  isUserAiProviderId,
  type AiProviderCatalogEntry,
  type UserAiProviderId,
} from '@/features/ai-credentials/ai-provider-catalog';
import type { AiCredentialPublicStatus } from '@/features/ai-credentials/ai-credentials.types';

const fieldClass =
  'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm outline-none focus-visible:ring-3 transition-all';

interface AiCredentialsFormProps {
  embedded?: boolean;
  onConfigured?: (status: AiCredentialPublicStatus) => void;
  className?: string;
}

export function AiCredentialsForm({ embedded = false, onConfigured, className }: AiCredentialsFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
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

  const handleTestConnection = async () => {
    if (!selected || testing) return;
    setTesting(true);
    setTestResult(null);
    setError(null);

    const keyToTest = apiKey.trim();

    try {
      const res = await fetch('/api/settings/ai-credentials/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selected.id,
          apiKey: keyToTest || undefined,
          defaultModel: selected.defaultModel,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || 'Connection test failed');
      }

      const msg = `Connected successfully (${json.data.model} in ${json.data.latencyMs}ms)`;
      setTestResult({ success: true, message: msg });
      toast.success('Connection Verified', { description: msg });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setTestResult({ success: false, message: msg });
      toast.error('Connection Test Failed', { description: msg });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    setTestResult(null);

    const keyToSave = apiKey.trim();
    if (keyToSave.length < 8) {
      setError('Please paste a full API key (at least 8 characters).');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/settings/ai-credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selected.id,
          apiKey: keyToSave,
          defaultModel: selected.defaultModel,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || 'Could not save API key');
      }
      setStatus(json.data);
      setApiKey('');
      toast.success('API Key Saved', {
        description: `${json.data.providerName} is now active for your AI company.`,
      });
      onConfigured?.(json.data);
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
      const res = await fetch('/api/settings/ai-credentials', { method: 'DELETE' });
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
      <div className={cn('flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Loading AI credentials…
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 shadow-xs">
        <div className="flex gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {embedded ? <Gift className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-heading text-base font-bold text-foreground">
              {embedded ? 'Connect Your AI Provider (BYOK)' : 'Bring Your Own Key (BYOK)'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Your AI company calls LLM providers securely using your API key. Keys are encrypted at rest with AES-256-GCM and never exposed to the client or project code.
            </p>
          </div>
        </div>
      </div>

      {status?.configured && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {status.providerName}
                <span className="ml-2 font-mono text-xs text-muted-foreground">{status.keyHint}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Model: <span className="font-medium text-foreground">{status.defaultModel ?? 'default'}</span> · Status: Connected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl font-medium"
              disabled={testing}
              onClick={() => void handleTestConnection()}
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-primary" />}
              Test Connection
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={removing}
              onClick={() => void handleRemove()}
            >
              {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Remove
            </Button>
          </div>
        </div>
      )}

      {testResult && (
        <div
          className={cn(
            'flex items-start gap-2.5 rounded-xl border p-3.5 text-xs',
            testResult.success
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-destructive/30 bg-destructive/10 text-destructive',
          )}
        >
          {testResult.success ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">{testResult.message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="space-y-2">
          <label htmlFor="ai-provider" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Select Provider
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProvider(p.id);
                  setTestResult(null);
                  setError(null);
                }}
                className={cn(
                  'flex flex-col items-start p-3 rounded-xl border text-left transition-all',
                  provider === p.id
                    ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                    : 'border-border bg-background/50 hover:border-primary/40 text-muted-foreground hover:text-foreground',
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-bold">{p.name}</span>
                  {p.pricing === 'free_tier' && (
                    <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                      Free
                    </span>
                  )}
                </div>
                <span className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{p.defaultModel}</span>
              </button>
            ))}
          </div>

          {selected && (
            <p className="mt-1 text-xs text-muted-foreground">{selected.description} {selected.pricingNote}</p>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <label htmlFor="ai-api-key" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {status?.configured ? 'New / Replace API Key' : `${selected?.name || ''} API Key`}
          </label>
          <div className="relative">
            <input
              id="ai-api-key"
              type={showKey ? 'text' : 'password'}
              required
              autoComplete="off"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
                setError(null);
              }}
              placeholder={selected?.keyPlaceholder ?? 'Paste your API key'}
              className={cn(fieldClass, 'pr-11 font-mono')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Shield className="h-3 w-3 text-emerald-500" />
            AES-256-GCM encrypted. Complete key is never shown again after saving.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="submit"
            className="flex-1 rounded-xl font-bold h-11"
            disabled={saving || apiKey.trim().length < 8}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Encrypting & Saving…
              </>
            ) : status?.configured ? (
              'Update API Key'
            ) : (
              'Save & Connect API Key'
            )}
          </Button>

          {apiKey.trim().length >= 8 && (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl font-medium px-4"
              disabled={testing || saving}
              onClick={() => void handleTestConnection()}
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-primary mr-1.5" />}
              Test Before Saving
            </Button>
          )}
        </div>
      </form>

      {selected && (
        <div className="rounded-2xl border border-border/80 bg-background/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              How to get a {selected.name} API key
            </h3>
            <a
              href={selected.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Open {selected.name} Key Console
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
            {selected.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {embedded && (
            <p className="mt-4 text-xs text-muted-foreground">
              You can manage or test this key anytime in{' '}
              <Link href={ROUTES.settings} className="font-semibold text-primary hover:underline">
                Settings
              </Link>
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}
