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
  'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus-visible:ring-3';

interface AiCredentialsFormProps {
  /** Compact embed for project-create gate */
  embedded?: boolean;
  onConfigured?: (status: AiCredentialPublicStatus) => void;
  className?: string;
}

export function AiCredentialsForm({ embedded = false, onConfigured, className }: AiCredentialsFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const freeProviders = useMemo(
    () => providers.filter((p) => p.pricing === 'free_tier'),
    [providers],
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/ai-credentials', { cache: 'no-store' });
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/ai-credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selected.id,
          apiKey,
          defaultModel: selected.defaultModel,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || 'Could not save API key');
      }
      setStatus(json.data);
      setApiKey('');
      toast.success('API key saved', {
        description: `${json.data.providerName} will be used for your AI company.`,
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
      <div className={cn('flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Loading AI settings…
      </div>
    );
  }

  return (
    <div className={cn('space-y-5', className)}>
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {embedded ? <Gift className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {embedded ? 'Start free — no payment needed' : 'Why an API key is required'}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {embedded
                ? 'Use Google Gemini or Groq free tiers to run your AI company without paying. Paid providers (OpenAI, Anthropic) are optional.'
                : 'Your AI company calls LLM providers with your key. Prefer Gemini or Groq if you want a free tier — we store keys encrypted and never show them again after save.'}
            </p>
          </div>
        </div>
      </div>

      {freeProviders.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Recommended free
          </p>
          <div className="flex flex-wrap gap-2">
            {freeProviders.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  provider === p.id
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
                )}
              >
                {p.name}
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  Free
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {status?.configured && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/80 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">
                {status.providerName} connected
                {status.keyHint ? (
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{status.keyHint}</span>
                ) : null}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Model: {status.defaultModel ?? 'default'} · Encrypted at rest
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-xl"
            disabled={removing}
            onClick={() => void handleRemove()}
          >
            {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Remove
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm">
        <div className="space-y-2">
          <label htmlFor="ai-provider" className="text-sm font-medium">
            Provider
          </label>
          <select
            id="ai-provider"
            value={provider}
            onChange={(e) => {
              if (isUserAiProviderId(e.target.value)) setProvider(e.target.value);
            }}
            className={fieldClass}
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.pricing === 'free_tier' ? `${p.name} — Free tier` : `${p.name} — Paid`}
              </option>
            ))}
          </select>
          {selected && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    selected.pricing === 'free_tier'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-accent/15 text-accent',
                  )}
                >
                  {selected.pricingLabel}
                </span>
                {selected.recommendedFree && (
                  <span className="text-[11px] font-medium text-primary">Best free start</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{selected.description}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{selected.pricingNote}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="ai-api-key" className="text-sm font-medium">
            {status?.configured ? 'Replace API key' : 'API key'}
          </label>
          <div className="relative">
            <input
              id="ai-api-key"
              type={showKey ? 'text' : 'password'}
              required
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={selected?.keyPlaceholder ?? 'Paste your API key'}
              className={cn(fieldClass, 'pr-11')}
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
            <Shield className="h-3 w-3" />
            Encrypted with your server key. Never logged or shown in full after save.
          </p>
        </div>

        <Button type="submit" className="w-full rounded-xl" disabled={saving || apiKey.trim().length < 8}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : status?.configured ? (
            'Update API key'
          ) : (
            'Save API key'
          )}
        </Button>
      </form>

      {selected && (
        <div className="rounded-2xl border border-border/80 bg-background/80 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">How to get a {selected.name} API key</h3>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                selected.pricing === 'free_tier'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-accent/15 text-accent',
              )}
            >
              {selected.pricingLabel}
            </span>
          </div>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-relaxed text-muted-foreground">
            {selected.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <a
            href={selected.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Open {selected.name} key page
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {embedded && (
            <p className="mt-4 text-xs text-muted-foreground">
              You can manage this later in{' '}
              <Link href={ROUTES.settings} className="font-medium text-primary hover:underline">
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
