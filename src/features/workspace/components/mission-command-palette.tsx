'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  FileStack,
  Play,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CommandActionId =
  | 'approve'
  | 'deliverables'
  | 'retry'
  | 'start'
  | 'review'
  | 'studio';

interface CommandItem {
  id: CommandActionId;
  label: string;
  hint: string;
  shortcut?: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

/**
 * Cursor-style ⌘K command palette for Mission Control.
 */
export function MissionCommandPalette({
  open,
  onOpenChange,
  onAction,
  canApprove,
  canRetry,
  canStart,
  canOpenStudio,
  hasDeliverables,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (id: CommandActionId) => void;
  canApprove?: boolean;
  canRetry?: boolean;
  canStart?: boolean;
  canOpenStudio?: boolean;
  hasDeliverables?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<CommandItem[]>(() => {
    const all: CommandItem[] = [
      {
        id: 'studio',
        label: 'Open Studio',
        hint: 'Editor, files, and live preview',
        icon: <Code2 className="h-4 w-4" />,
        disabled: !canOpenStudio,
      },
      {
        id: 'approve',
        label: 'Approve & continue',
        hint: 'Accept the current document and advance',
        shortcut: '↵',
        icon: <CheckCircle2 className="h-4 w-4" />,
        disabled: !canApprove,
      },
      {
        id: 'deliverables',
        label: 'Open Deliverables',
        hint: 'Reopen saved Architecture, Proposal, and more',
        icon: <FileStack className="h-4 w-4" />,
        disabled: !hasDeliverables,
      },
      {
        id: 'retry',
        label: 'Retry generation',
        hint: 'Resume a stalled or failed phase',
        icon: <RefreshCw className="h-4 w-4" />,
        disabled: !canRetry,
      },
      {
        id: 'start',
        label: 'Start building',
        hint: 'Launch the AI company pipeline',
        icon: <Play className="h-4 w-4" />,
        disabled: !canStart,
      },
      {
        id: 'review',
        label: 'Focus Review panel',
        hint: 'Jump to the current approval document',
        icon: <Search className="h-4 w-4" />,
        disabled: !canApprove,
      },
    ];
    const q = query.trim().toLowerCase();
    return all.filter(
      (item) =>
        !q ||
        item.label.toLowerCase().includes(q) ||
        item.hint.toLowerCase().includes(q),
    );
  }, [query, canApprove, canRetry, canStart, canOpenStudio, hasDeliverables]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, Math.max(0, items.length - 1)));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && items[active] && !items[active]?.disabled) {
        e.preventDefault();
        onAction(items[active]!.id);
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange, onAction, items, active]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
        aria-label="Close command palette"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-fade-in">
        <div className="flex items-center gap-2 border-b border-border px-3.5 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Type a command…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            esc
          </kbd>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted sm:hidden"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="max-h-72 overflow-y-auto p-1.5">
          {items.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matching commands
            </li>
          )}
          {items.map((item, idx) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={item.disabled}
                onMouseEnter={() => setActive(idx)}
                onClick={() => {
                  if (item.disabled) return;
                  onAction(item.id);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                  idx === active && !item.disabled && 'bg-primary/10 text-foreground',
                  item.disabled && 'opacity-40',
                  !item.disabled && idx !== active && 'hover:bg-muted/60',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    idx === active && !item.disabled
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {item.hint}
                  </span>
                </span>
                {item.shortcut && (
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-border px-3.5 py-2 text-[11px] text-muted-foreground">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>{' '}
          toggle · ↑↓ navigate · Enter run
        </div>
      </div>
    </div>
  );
}
