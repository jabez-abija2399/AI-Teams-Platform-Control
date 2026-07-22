'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshCw, Monitor, Tablet, Smartphone, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CodeExplorerFallback } from './code-explorer-fallback';

type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

const VIEWPORT_ICONS: Record<Viewport, typeof Monitor> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

export function LivePreview({ projectId }: { projectId: string }) {
  const [preview, setPreview] = useState<{ type: string; html?: string; url?: string; reason?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPreview = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/preview/${projectId}`);
      const result = await res.json();
      setPreview(result.data);
    } catch {
      setPreview({ type: 'UNSUPPORTED', reason: 'Failed to load preview.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  useEffect(() => {
    if (!autoRefresh) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => fetchPreview(true), 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchPreview]);

  function reload() {
    fetchPreview();
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Building preview...
      </div>
    );
  }

  if (!preview || preview.type === 'UNSUPPORTED') {
    return (
      <div className="flex h-full flex-col">
        <PreviewToolbar
          viewport={viewport}
          setViewport={setViewport}
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          onRefresh={reload}
          refreshing={refreshing}
        />
        <CodeExplorerFallback projectId={projectId} reason={preview?.reason} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PreviewToolbar
        viewport={viewport}
        setViewport={setViewport}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        onRefresh={reload}
        refreshing={refreshing}
      />
      <div className="flex flex-1 items-start justify-center overflow-auto bg-gray-100 p-2">
        <iframe
          ref={iframeRef}
          srcDoc={preview.html}
          sandbox="allow-scripts allow-same-origin"
          className={cn(
            'border bg-white shadow-sm transition-all duration-300',
            viewport === 'desktop' ? 'h-full w-full' : 'h-[600px]',
          )}
          style={{ maxWidth: VIEWPORT_WIDTHS[viewport] }}
          title="Live preview"
        />
      </div>
    </div>
  );
}

function PreviewToolbar({
  viewport,
  setViewport,
  autoRefresh,
  setAutoRefresh,
  onRefresh,
  refreshing,
}: {
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
  autoRefresh: boolean;
  setAutoRefresh: (v: boolean) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="flex h-9 items-center justify-between border-b px-3">
      <span className="text-xs text-muted-foreground">Preview</span>
      <div className="flex items-center gap-1">
        <div className="flex items-center rounded-md border">
          {(Object.keys(VIEWPORT_ICONS) as Viewport[]).map((v) => {
            const Icon = VIEWPORT_ICONS[v];
            return (
              <button
                key={v}
                onClick={() => setViewport(v)}
                className={cn(
                  'p-1 transition-colors',
                  viewport === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                )}
                title={v}
              >
                <Icon className="h-3 w-3" />
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={cn(
            'rounded px-1.5 py-0.5 text-[10px] transition-colors',
            autoRefresh ? 'bg-green-100 text-green-700' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          Auto
        </button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
        </Button>
      </div>
    </div>
  );
}
