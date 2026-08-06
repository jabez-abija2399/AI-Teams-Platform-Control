'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
  XCircle,
  Zap,
  Server,
  Settings2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import { useWebContainerPreview } from '@/hooks/use-webcontainer-preview';
import { StackSelect } from '@/features/workspace/components/stack-select';
import {
  DEFAULT_PROJECT_STACK,
  type ProjectStackId,
} from '@/core/project-stack/stack-catalog';

type Viewport = 'desktop' | 'tablet' | 'mobile';
type SpeedMode = 'fast' | 'full';

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

interface PreviewStackInfo {
  id: ProjectStackId;
  label: string;
  shortLabel: string;
  honesty: string;
  speed: string;
  strategy: string;
  confirmed: boolean;
  needsConfirmation: boolean;
  detected: {
    stack: ProjectStackId;
    confidence: string;
    rationale: string;
    signals: string[];
  };
}

interface PreviewPayload {
  type: string;
  mode?: 'static' | 'babel' | 'webcontainer' | 'choose';
  html?: string;
  files?: Record<string, string>;
  entryPath?: string;
  constraintLabel?: string;
  reason?: string;
  smoke?: {
    ok: boolean;
    checks: { id: string; pass: boolean; detail: string }[];
  };
  stack?: PreviewStackInfo;
  fastAvailable?: boolean;
  fullAvailable?: boolean;
  speed?: SpeedMode;
}

function statusLabel(wcStatus: string, mode: string, loading: boolean): string {
  if (loading) return 'Loading';
  if (mode === 'webcontainer') {
    if (wcStatus === 'READY') return 'Live';
    if (wcStatus === 'ERROR') return 'Error';
    if (wcStatus === 'IDLE') return 'Starting';
    return wcStatus.charAt(0) + wcStatus.slice(1).toLowerCase();
  }
  if (mode === 'static' || mode === 'babel') return 'Instant';
  return 'Ready';
}

/**
 * Production Preview — Cursor-inspired browser chrome.
 * Runs on the user's saved stack. Fast by default. Stack settings are opt-in only.
 */
export function VibePreview({ projectId }: { projectId: string }) {
  const openTabs = useWorkspaceStore((s) => s.openTabs);
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);
  const activePath = openTabs.find((t) => t.id === activeTabId)?.path ?? null;
  const entryHint = activePath?.endsWith('.html') ? activePath : null;

  const [payload, setPayload] = useState<PreviewPayload | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStack, setSavingStack] = useState(false);
  const [showStackSettings, setShowStackSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [speedMode, setSpeedMode] = useState<SpeedMode>('fast');
  const [reloadKey, setReloadKey] = useState(0);

  const wc = useWebContainerPreview();
  const loadGenRef = useRef(0);

  const load = useCallback(async () => {
    if (!projectId) return;
    const gen = ++loadGenRef.current;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ smoke: '1', speed: speedMode });
      if (entryHint) qs.set('entry', entryHint);
      const res = await fetch(`/api/preview/${projectId}?${qs.toString()}`);
      if (!res.ok) throw new Error('Preview request failed');
      const json = await res.json();
      if (gen !== loadGenRef.current) return; // stale project switch
      const data = (json.data || json) as PreviewPayload;
      setPayload(data);
      if (data.html) setHtml(data.html);
      else if (data.reason) setError(data.reason);

      if (
        speedMode === 'full' &&
        data.mode === 'webcontainer' &&
        data.files &&
        Object.keys(data.files).length > 0
      ) {
        if (gen !== loadGenRef.current) return;
        const runtime = data.stack?.id === 'react' ? 'vite' : 'next';
        wc.start(data.files, runtime).catch(() => {});
      } else if (speedMode === 'fast') {
        wc.stop();
      }
    } catch (err) {
      if (gen !== loadGenRef.current) return;
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      if (gen === loadGenRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, entryHint, reloadKey, speedMode]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    loadGenRef.current += 1;
    setShowStackSettings(false);
    setSpeedMode('fast');
    setPayload(null);
    setHtml(null);
    setError(null);
    setLoading(true);
    wc.stop();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps — stop previous project's runtime

  useEffect(() => {
    const onReload = () => setReloadKey((k) => k + 1);
    window.addEventListener('studio-preview-reload', onReload);
    window.addEventListener('toggle-workspace-preview', onReload);
    return () => {
      window.removeEventListener('studio-preview-reload', onReload);
      window.removeEventListener('toggle-workspace-preview', onReload);
    };
  }, []);

  const confirmStack = useCallback(
    async (stackId: ProjectStackId) => {
      setSavingStack(true);
      try {
        const previous = payload?.stack?.confirmed ? payload.stack.id : null;
        const changing = previous != null && previous !== stackId;

        let regenerateArchitecture = false;
        if (changing) {
          regenerateArchitecture = window.confirm(
            `Change stack from ${previous} to ${stackId}?\n\n` +
              'OK = also regenerate Architecture · Cancel = save stack only',
          );
        }

        const res = await fetch(`/api/projects/${projectId}/stack`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stack: stackId, regenerateArchitecture }),
        });
        if (!res.ok) throw new Error('Could not save stack');
        window.dispatchEvent(new CustomEvent('project-stack-changed'));
        setShowStackSettings(false);
        setSpeedMode('fast');
        setReloadKey((k) => k + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save stack');
      } finally {
        setSavingStack(false);
      }
    },
    [projectId, payload?.stack],
  );

  const mode = payload?.mode ?? 'static';
  const stack = payload?.stack;
  const iframeSrc = mode === 'webcontainer' && speedMode === 'full' && wc.previewUrl
    ? wc.previewUrl
    : undefined;
  const showFrame = Boolean(iframeSrc || html);
  const liveLabel = statusLabel(wc.status, mode, loading);

  const urlBarText = useMemo(() => {
    if (iframeSrc) return iframeSrc.replace(/^https?:\/\//, '');
    if (payload?.entryPath) return `preview://${payload.entryPath}`;
    return 'preview://app';
  }, [iframeSrc, payload?.entryPath]);

  const draftStack =
    (stack?.confirmed ? stack.id : null) ||
    (stack?.detected.stack !== 'unknown' ? stack?.detected.stack : null) ||
    DEFAULT_PROJECT_STACK;

  const [stackDraft, setStackDraft] = useState<ProjectStackId>(draftStack);
  useEffect(() => {
    setStackDraft(draftStack);
  }, [draftStack]);

  return (
    <div className="flex h-full flex-col bg-[var(--brand-cream)] text-foreground">
      {/* Toolbar — single clear row */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border/60 bg-white/90 px-2.5 backdrop-blur-md">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {/* Stack chip — read-only; settings to change */}
          <span
            title={stack?.label || 'Delivery stack'}
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide',
              stack?.confirmed
                ? 'bg-primary/12 text-primary'
                : 'bg-[var(--brand-teal)]/10 text-[var(--brand-teal)]',
            )}
          >
            {stack?.shortLabel ?? 'HTML/CSS'}
          </span>

          <span
            className={cn(
              'hidden shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:inline-flex',
              liveLabel === 'Instant' || liveLabel === 'Live'
                ? 'bg-emerald-500/10 text-emerald-700'
                : liveLabel === 'Error'
                  ? 'bg-accent/10 text-accent'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                liveLabel === 'Instant' || liveLabel === 'Live'
                  ? 'bg-emerald-500'
                  : liveLabel === 'Error'
                    ? 'bg-accent'
                    : 'animate-pulse bg-primary',
              )}
            />
            {liveLabel}
          </span>

          {payload?.smoke && (
            <span
              className={cn(
                'hidden items-center gap-0.5 text-[10px] font-medium md:inline-flex',
                payload.smoke.ok ? 'text-primary' : 'text-accent',
              )}
              title="Smoke checks"
            >
              {payload.smoke.ok ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
            </span>
          )}
        </div>

        {/* Fast / Full — only when Full runtime exists */}
        {payload?.fullAvailable && (
          <div
            className="flex shrink-0 items-center rounded-lg border border-border/80 bg-[var(--brand-cream)]/80 p-0.5"
            role="group"
            aria-label="Preview speed"
          >
            <button
              type="button"
              title="Instant preview (recommended)"
              onClick={() => {
                setSpeedMode('fast');
                setReloadKey((k) => k + 1);
              }}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors',
                speedMode === 'fast'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Zap className="h-3 w-3" />
              Fast
            </button>
            <button
              type="button"
              title="Full runtime (WebContainer)"
              onClick={() => {
                setSpeedMode('full');
                setReloadKey((k) => k + 1);
              }}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors',
                speedMode === 'full'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Server className="h-3 w-3" />
              Full
            </button>
          </div>
        )}

        {/* Viewport */}
        <div className="flex shrink-0 items-center rounded-lg border border-border/80 bg-white p-0.5">
          {(
            [
              ['desktop', Monitor],
              ['tablet', Tablet],
              ['mobile', Smartphone],
            ] as const
          ).map(([id, Icon]) => (
            <button
              key={id}
              type="button"
              title={id}
              onClick={() => setViewport(id)}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                viewport === id
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <button
          type="button"
          title="Reload"
          onClick={() => setReloadKey((k) => k + 1)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </button>

        {iframeSrc && (
          <a
            href={iframeSrc}
            target="_blank"
            rel="noreferrer"
            title="Open in new tab"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        <button
          type="button"
          title="Stack settings"
          onClick={() => setShowStackSettings((v) => !v)}
          className={cn(
            'rounded-md p-1.5 transition-colors',
            showStackSettings
              ? 'bg-primary/12 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Browser chrome */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(36,95,115,0.10), transparent 55%), linear-gradient(180deg, #ebe8e6 0%, var(--brand-cream) 40%)',
          }}
        />

        {/* Stack settings drawer — only when user opens it */}
        {showStackSettings && (
          <div className="absolute inset-0 z-30 flex justify-end bg-[rgba(26,51,57,0.28)] backdrop-blur-[2px]">
            <div className="flex h-full w-full max-w-sm flex-col border-l border-border/80 bg-white shadow-2xl">
              <div className="flex h-11 items-center justify-between border-b border-border/70 px-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                    Stack
                  </p>
                  <p className="text-sm font-semibold text-foreground">Delivery settings</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStackSettings(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                  Chosen at create — Preview already uses this. Change only if you want a different
                  runtime.
                </p>
                <StackSelect
                  value={stackDraft}
                  onChange={setStackDraft}
                  disabled={savingStack}
                  compact
                />
              </div>
              <div className="flex gap-2 border-t border-border/70 p-4">
                <Button
                  type="button"
                  className="flex-1"
                  disabled={savingStack || stackDraft === 'unknown'}
                  onClick={() => void confirmStack(stackDraft)}
                >
                  {savingStack ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    'Save stack'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingStack}
                  onClick={() => setShowStackSettings(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="relative flex h-full flex-col p-3 sm:p-4">
          {/* Window frame */}
          <div
            className="mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border/70 bg-white shadow-[0_16px_48px_rgba(36,95,115,0.12)] transition-[max-width] duration-300 ease-out"
            style={{ maxWidth: VIEWPORT_WIDTHS[viewport] }}
          >
            {/* Title bar */}
            <div className="flex h-9 shrink-0 items-center gap-3 border-b border-border/60 bg-[#f7f5f4] px-3">
              <div className="flex items-center gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-[#e8a09a]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#e8d49a]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#a8d4b8]" />
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-center">
                <div className="flex w-full max-w-md items-center gap-2 rounded-md border border-border/50 bg-white px-2.5 py-1 text-[10px] text-muted-foreground shadow-sm">
                  <span className="shrink-0 font-medium text-primary/70">
                    {speedMode === 'fast' ? '⚡' : '●'}
                  </span>
                  <span className="truncate font-mono">{urlBarText}</span>
                </div>
              </div>
              <div className="w-[42px]" />
            </div>

            {/* Content */}
            <div className="relative min-h-0 flex-1 bg-white">
              {loading && !showFrame && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full border-2 border-primary/20" />
                    <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {speedMode === 'full' ? 'Starting full runtime…' : 'Building instant preview…'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stack?.label || 'Your project'} · {speedMode === 'fast' ? 'Fast' : 'Full'}
                    </p>
                  </div>
                </div>
              )}

              {!loading && !showFrame && (
                <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-heading text-lg font-semibold text-foreground">
                      {error ? 'Preview not ready' : 'Waiting for files'}
                    </p>
                    <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
                      {error ||
                        'Explorer will sync files for your saved stack. Preview starts automatically.'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setReloadKey((k) => k + 1)}
                      className="rounded-lg"
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Retry
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowStackSettings(true)}
                      className="rounded-lg"
                    >
                      Stack settings
                    </Button>
                  </div>
                </div>
              )}

              {iframeSrc ? (
                <iframe
                  key={`url-${reloadKey}-${iframeSrc}`}
                  title="Live preview"
                  src={iframeSrc}
                  className="h-full w-full border-0 bg-white"
                  sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-popups"
                />
              ) : html ? (
                <iframe
                  key={`doc-${reloadKey}-${payload?.entryPath}-${speedMode}-${mode}`}
                  title="Stack preview"
                  srcDoc={html}
                  className="h-full w-full border-0 bg-white"
                  sandbox="allow-scripts allow-forms allow-modals"
                />
              ) : null}

              {/* Full mode boot overlay while WC starts but we may show babel html underneath */}
              {speedMode === 'full' &&
                mode === 'webcontainer' &&
                !iframeSrc &&
                html &&
                wc.status !== 'READY' &&
                wc.status !== 'ERROR' && (
                  <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/95 px-3 py-1.5 text-[10px] font-medium text-foreground shadow-lg backdrop-blur">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      Booting {stack?.id === 'react' ? 'Vite' : 'Next.js'}… showing Fast preview
                      meanwhile
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="flex h-7 shrink-0 items-center justify-between gap-2 border-t border-border/60 bg-white/80 px-3 text-[10px] text-muted-foreground">
        <span className="truncate">
          {stack?.confirmed ? `${stack.shortLabel} · Saved` : stack?.shortLabel || 'Preview'}
          {speedMode === 'fast' ? ' · Instant' : ' · Full runtime'}
        </span>
        <span className="hidden truncate sm:inline">
          {speedMode === 'fast'
            ? 'Fast = no install'
            : stack?.honesty?.slice(0, 72) || 'WebContainer runtime'}
        </span>
      </div>
    </div>
  );
}
