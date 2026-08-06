'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Expand, FileText, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentDrawer } from './document-drawer';
import {
  DocumentBody,
  documentToSections,
  type ReadableDocument,
} from './document-reader';
import { DocumentDiffView, type RevisionDiffData } from './document-diff-view';

export type PendingDocument = ReadableDocument;

/**
 * Approval panel — preview + comment/approve stay put;
 * Large view opens a side drawer so controls remain visible on xl+.
 */
export function ApprovalReviewPanel({
  approvalTitle,
  document,
  revisionDiff,
  approving,
  regenerating,
  onApprove,
  onRequestChanges,
}: {
  approvalTitle: string;
  document: PendingDocument | null;
  revisionDiff?: RevisionDiffData | null;
  approving?: boolean;
  regenerating?: boolean;
  onApprove: () => void;
  onRequestChanges: (comments: string) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [comments, setComments] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const previewSections = useMemo(
    () => documentToSections(document?.content, false),
    [document?.content],
  );
  const busy = Boolean(approving || regenerating);
  const canRegenerate = comments.trim().length >= 3 && !busy;
  const canApprove = reviewed && !busy;

  useEffect(() => {
    setReviewed(false);
    setComments('');
    setLocalError(null);
    setDrawerOpen(false);
  }, [document?.type, document?.title, approvalTitle]);

  // Keyboard: Enter after checkbox → Approve; ⌘/Ctrl+Enter with comments → regenerate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busy) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const inTextarea = tag === 'textarea' || tag === 'input';

      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        const trimmed = comments.trim();
        if (trimmed.length >= 3) {
          e.preventDefault();
          setLocalError(null);
          onRequestChanges(trimmed);
        }
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        if (inTextarea && tag === 'textarea') return;
        if (canApprove) {
          e.preventDefault();
          onApprove();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, canApprove, comments, onApprove, onRequestChanges]);

  const handleRegenerate = () => {
    const trimmed = comments.trim();
    if (trimmed.length < 3) {
      setLocalError('Add a short comment about what to change first.');
      return;
    }
    setLocalError(null);
    onRequestChanges(trimmed);
  };

  return (
    <>
      <div className="mt-auto space-y-3 rounded-xl border border-accent/25 bg-accent/5 p-4 focus-within:ring-2 focus-within:ring-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Review before you decide</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {approvalTitle}. Open the drawer to read while approve/comment stay here.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {document?.title || 'Generated document'}
              </p>
              {document?.producedBy && (
                <p className="truncate text-[11px] text-muted-foreground">
                  Prepared by {document.producedBy}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1.5 rounded-lg"
              onClick={() => setDrawerOpen(true)}
            >
              <Expand className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open drawer</span>
              <span className="sm:hidden">Read</span>
            </Button>
          </div>
          <div className="max-h-44 space-y-3 overflow-y-auto px-3.5 py-3 xl:max-h-[min(40vh,360px)]">
            <DocumentBody
              document={document}
              sections={previewSections.slice(0, 6)}
            />
            {previewSections.length > 6 && (
              <p className="text-xs text-muted-foreground">
                +{previewSections.length - 6} more sections in the side drawer
              </p>
            )}
          </div>
        </div>

        {revisionDiff && (
          <DocumentDiffView diff={revisionDiff} />
        )}

        <div className="space-y-2">
          <label className="block text-xs font-medium text-foreground sm:text-sm">
            Not ready to approve? Tell the AI what to change
          </label>
          <textarea
            value={comments}
            onChange={(e) => {
              setComments(e.target.value);
              if (localError) setLocalError(null);
            }}
            disabled={busy}
            rows={3}
            placeholder="e.g. Make it simpler — only email login and a protected home page. Remove social login."
            className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
          />
          {localError && <p className="text-xs text-destructive">{localError}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRegenerate}
              disabled={!canRegenerate}
              className="h-10 rounded-xl font-semibold sm:min-w-[220px]"
            >
              {regenerating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Regenerating…
                </span>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Request changes & regenerate
                </>
              )}
            </Button>
            <span className="hidden text-[11px] text-muted-foreground sm:inline">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                ⌘↵
              </kbd>{' '}
              with comments
            </span>
          </div>
        </div>

        <div className="space-y-3 border-t border-border/80 pt-3">
          <label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground sm:text-sm">
            <input
              ref={checkboxRef}
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
              disabled={busy}
              className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-[var(--brand-teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <span>
              I have reviewed this document and want the AI company to continue.
              {reviewed && (
                <span className="ml-1 text-[11px] text-foreground/70">
                  Press{' '}
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                    Enter
                  </kbd>{' '}
                  to continue
                </span>
              )}
            </span>
          </label>
          <Button
            onClick={onApprove}
            disabled={!canApprove}
            className="h-11 w-full rounded-xl font-semibold sm:w-auto sm:min-w-[220px]"
          >
            {approving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Approving…
              </span>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve & continue
              </>
            )}
          </Button>
        </div>
      </div>

      <DocumentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        document={document}
        subtitle={approvalTitle}
      />
    </>
  );
}
