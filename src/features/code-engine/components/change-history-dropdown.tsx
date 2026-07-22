'use client';

import { useState, useEffect } from 'react';
import { History, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/utils/format';
import { toast } from 'sonner';

interface Change {
  id: string;
  file: string;
  changeType: string;
  description: string;
  createdAt: string;
}

export function ChangeHistoryDropdown({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [changes, setChanges] = useState<Change[]>([]);

  useEffect(() => {
    if (open) {
      fetch(`/api/code/change-history?projectId=${projectId}`)
        .then((r) => r.json())
        .then((res) => res.success && setChanges(res.data))
        .catch(() => {});
    }
  }, [open, projectId]);

  async function handleRevert(changeId: string, filePath: string) {
    const res = await fetch('/api/code/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeId }),
    });
    const result = await res.json();
    if (result.success) {
      toast.success(`Reverted ${filePath}`);
    } else {
      toast.error(result.error?.message ?? 'Revert failed');
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen((o) => !o)}>
        <History className="h-3.5 w-3.5" /> History <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-md border bg-popover p-1 shadow-md">
          {changes.length === 0 ? (
            <p className="p-3 text-center text-xs text-muted-foreground">No changes yet.</p>
          ) : (
            changes.map((c) => (
              <button
                key={c.id}
                onClick={() => handleRevert(c.id, c.file)}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs hover:bg-secondary"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono">{c.file}</p>
                  <p className="text-muted-foreground">
                    {c.changeType} · {formatRelativeTime(new Date(c.createdAt))}
                  </p>
                </div>
                <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">Revert</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
