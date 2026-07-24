'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { TerminalLogEntry } from '@/hooks/use-ai-build-stream';

interface TerminalDrawerProps {
  logs: TerminalLogEntry[];
  onClearLogs: () => void;
}

export function TerminalDrawer({ logs, onClearLogs }: TerminalDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isExpanded && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  return (
    <div className="border-t border-slate-800 bg-slate-950 flex flex-col transition-all duration-200">
      {/* Header Bar */}
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between select-none">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-slate-100 transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span>Agent SSE Event Stream Terminal</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {logs.length}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
            title="Clear Terminal Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Terminal Content Body */}
      {isExpanded && (
        <div className="h-44 p-3 font-mono text-xs overflow-y-auto bg-slate-950 space-y-1.5 select-text">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">No event logs streamed yet...</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-600 select-none text-[10px] pt-0.5">{log.timestamp}</span>
                <span
                  className={clsx(
                    'flex-1 whitespace-pre-wrap break-all',
                    log.level === 'error' && 'text-red-400 font-semibold',
                    log.level === 'warn' && 'text-amber-300',
                    log.level === 'info' && 'text-emerald-400'
                  )}
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
