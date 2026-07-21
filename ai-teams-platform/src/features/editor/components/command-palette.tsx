'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCommandPalette } from './providers/command-palette-provider';

export function CommandPalette() {
  const { isOpen, commands, close, executeCommand } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevIsOpenRef = useRef(isOpen);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        cmd.category.toLowerCase().includes(lower),
    );
  }, [commands, query]);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSelectedIndex(() => 0);
  }, []);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(filtered.length, 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (filtered[selectedIndex]) {
            executeCommand(filtered[selectedIndex].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [filtered, selectedIndex, executeCommand, close],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="bg-background/80 fixed inset-0 backdrop-blur-sm" />
      <div className="bg-background relative z-10 w-full max-w-lg rounded-lg border shadow-2xl">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="text-muted-foreground h-4 w-4 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command…"
            className="bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="text-muted-foreground px-4 py-6 text-center text-sm">
              No commands found
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={cmd.id}
                onClick={() => executeCommand(cmd.id)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  'flex w-full items-center justify-between px-4 py-2 text-sm',
                  idx === selectedIndex ? 'bg-accent text-accent-foreground' : 'text-foreground',
                )}
              >
                <span>{cmd.label}</span>
                <span className="text-muted-foreground ml-4 text-xs">{cmd.category}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
