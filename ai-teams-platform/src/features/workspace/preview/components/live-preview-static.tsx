'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeExplorerFallback } from './code-explorer-fallback';

export function LivePreviewStatic({ projectId }: { projectId: string }) {
  const [preview, setPreview] = useState<{ type: string; html?: string; reason?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/preview/${projectId}`, { signal: controller.signal });
        const result = await res.json();
        if (!controller.signal.aborted) setPreview(result.data);
      } catch {
        if (!controller.signal.aborted) setPreview({ type: 'UNSUPPORTED', reason: 'Failed to load preview.' });
      }
      if (!controller.signal.aborted) setLoading(false);
    }
    void fetchData();
    return () => controller.abort();
  }, [projectId]);

  function reload() {
    setLoading(true);
    fetch(`/api/preview/${projectId}`)
      .then((r) => r.json())
      .then((result) => setPreview(result.data))
      .catch(() => setPreview({ type: 'UNSUPPORTED', reason: 'Failed to load preview.' }))
      .finally(() => setLoading(false));
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Building preview…
      </div>
    );
  }

  if (!preview || preview.type === 'UNSUPPORTED') {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-9 items-center justify-between border-b px-3">
          <span className="text-xs text-muted-foreground">Preview unavailable</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={reload}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
        <CodeExplorerFallback projectId={projectId} reason={preview?.reason} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 items-center justify-between border-b px-3">
        <span className="text-xs text-muted-foreground">Live preview</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={reload}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
      <iframe
        srcDoc={preview.html}
        sandbox="allow-scripts"
        className="flex-1 border-0 bg-white"
        title="Live preview"
      />
    </div>
  );
}
