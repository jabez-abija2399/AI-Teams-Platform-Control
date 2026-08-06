'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Package, Pin, PinOff, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PipelineArtifact } from '@/features/workspace/hooks/use-pipeline';
import { DocumentDrawer } from './document-drawer';
import type { ReadableDocument } from './document-reader';
import {
  downloadMarkdown,
  exportDeliverablePdf,
} from '../lib/deliverable-export';

function pinKey(projectId: string) {
  return `mc-pins:${projectId}`;
}

/**
 * Persist last-approved docs — pin, reopen, export Markdown / PDF.
 */
export function DeliverablesPanel({
  projectId,
  artifacts,
  className,
}: {
  projectId?: string;
  artifacts: PipelineArtifact[];
  className?: string;
}) {
  const [openDoc, setOpenDoc] = useState<ReadableDocument | null>(null);
  const [pins, setPins] = useState<string[]>([]);

  useEffect(() => {
    if (!projectId || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(pinKey(projectId));
      if (raw) setPins(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, [projectId]);

  const persistPins = (next: string[]) => {
    setPins(next);
    if (!projectId) return;
    try {
      window.localStorage.setItem(pinKey(projectId), JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const sorted = useMemo(() => {
    const pinSet = new Set(pins);
    return [...artifacts].sort((a, b) => {
      const ap = pinSet.has(a.id) ? 0 : 1;
      const bp = pinSet.has(b.id) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return 0;
    });
  }, [artifacts, pins]);

  if (!artifacts.length) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center',
          className,
        )}
      >
        <Package className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">No deliverables yet</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Approved docs land here. Pin favorites and export as Markdown or PDF anytime.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={cn('space-y-2', className)}>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Pin important docs. Export Markdown or Print → PDF.
        </p>
        {sorted.map((art) => {
          const pinned = pins.includes(art.id);
          const doc: ReadableDocument = {
            title: art.name,
            type: art.type,
            summary: art.summary,
            producedBy: art.producedBy || art.createdBy,
            content: art.content,
          };
          return (
            <div
              key={art.id}
              className={cn(
                'rounded-xl border bg-background transition-colors',
                pinned ? 'border-primary/30 bg-primary/[0.03]' : 'border-border/80',
              )}
            >
              <button
                type="button"
                onClick={() => setOpenDoc(doc)}
                className="flex w-full items-start gap-3 px-3.5 py-3 text-left hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {pinned && <Pin className="mr-1 inline h-3 w-3 text-primary" />}
                    {art.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {art.producedBy || art.createdBy}
                    {art.status === 'approved' ? ' · Approved' : ''}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-primary">Open</span>
              </button>
              <div className="flex flex-wrap gap-1 border-t border-border/60 px-2 py-1.5">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() =>
                    persistPins(
                      pinned ? pins.filter((id) => id !== art.id) : [...pins, art.id],
                    )
                  }
                >
                  {pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                  {pinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => downloadMarkdown(doc)}
                >
                  <Download className="h-3 w-3" />
                  Markdown
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => exportDeliverablePdf(doc)}
                >
                  <Printer className="h-3 w-3" />
                  PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <DocumentDrawer
        open={Boolean(openDoc)}
        onClose={() => setOpenDoc(null)}
        document={openDoc}
        subtitle="Saved deliverable"
      />
    </>
  );
}
