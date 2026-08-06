'use client';

import { useEffect } from 'react';
import { FileText, PanelRightClose, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DocumentBody,
  documentToSections,
  type ReadableDocument,
} from './document-reader';

/**
 * Side drawer reader — approve/comment stay visible on the left.
 * Full-screen fallback on small screens.
 */
export function DocumentDrawer({
  open,
  onClose,
  document,
  subtitle,
}: {
  open: boolean;
  onClose: () => void;
  document: ReadableDocument | null;
  subtitle?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      window.document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const sections = documentToSections(document?.content, true);

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
        aria-label="Close document drawer"
        onClick={onClose}
      />

      <aside
        className={cn(
          'relative z-10 flex h-full w-full flex-col border-l border-border bg-background shadow-2xl',
          'sm:max-w-xl md:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl',
          'animate-drawer-in',
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-heading text-base font-semibold tracking-tight">
                {document?.title || 'Document'}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {subtitle || document?.producedBy || 'Deliverable'}
                {' · '}
                <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                  Esc
                </kbd>{' '}
                to close
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden h-8 gap-1.5 rounded-lg sm:inline-flex"
              onClick={onClose}
            >
              <PanelRightClose className="h-3.5 w-3.5" />
              Close
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <article className="px-4 py-6 sm:px-6 sm:py-8">
            <DocumentBody document={document} sections={sections} large />
          </article>
        </div>
      </aside>
    </div>
  );
}
