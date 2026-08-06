'use client';

import { useCallback, useEffect, useState } from 'react';
import { Layers, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectStackId } from '@/core/project-stack/stack-catalog';

interface StackBadgeProps {
  projectId: string;
  className?: string;
}

/**
 * Always-visible Mission Control stack chip: "HTML/CSS · Saved"
 */
export function MissionControlStackBadge({ projectId, className }: StackBadgeProps) {
  const [label, setLabel] = useState<string | null>(null);
  const [short, setShort] = useState<string>('Stack');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/stack`);
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data;
      const id = (data?.confirmed || data?.detected?.stack) as ProjectStackId | undefined;
      const entry = data?.catalog?.find((c: { id: string }) => c.id === id);
      setShort(entry?.shortLabel || data?.entry?.shortLabel || 'Stack');
      setLabel(entry?.label || data?.entry?.label || null);
      setConfirmed(Boolean(data?.confirmed));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
    const onChange = () => void load();
    window.addEventListener('project-stack-changed', onChange);
    return () => window.removeEventListener('project-stack-changed', onChange);
  }, [load]);

  return (
    <span
      title={label || 'Project delivery stack'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium',
        confirmed
          ? 'border-primary/20 bg-primary/10 text-primary'
          : 'border-accent/25 bg-accent/10 text-accent',
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Layers className="h-3 w-3" />
      )}
      <span>
        {short}
        {confirmed ? ' · Saved' : ' · Choose'}
      </span>
    </span>
  );
}
