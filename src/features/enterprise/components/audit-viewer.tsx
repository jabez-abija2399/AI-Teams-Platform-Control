'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { ScrollText, RefreshCw } from 'lucide-react';
import { formatRelativeTime } from '@/utils/format';

interface AuditLogEntry {
  id: string;
  organizationId: string;
  actorType: string;
  actorId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

function AuditActionBadge({ action }: { action: string }) {
  const actionStyles: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    LOGIN: 'bg-purple-100 text-purple-800',
    DEPLOY: 'bg-orange-100 text-orange-800',
    ROLE_CHANGE: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <Badge className={actionStyles[action] ?? 'bg-gray-100 text-gray-800'}>
      {action}
    </Badge>
  );
}

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border px-3 py-2">
      <AuditActionBadge action={entry.action} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">
            {entry.actorType}:{' '}
            <span className="text-muted-foreground font-normal">{entry.actorId}</span>
          </p>
        </div>
        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
          <p className="text-muted-foreground mt-0.5 text-xs">
            {Object.entries(entry.metadata)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(' · ')}
          </p>
        )}
      </div>
      <span className="text-muted-foreground shrink-0 text-xs">
        {formatRelativeTime(entry.createdAt)}
      </span>
    </div>
  );
}

export function AuditViewer({ organizationId }: { organizationId: string }) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [limit, setLimit] = useState('100');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ organizationId, limit });
      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setEntries(json.data);
      }
    } catch {
      // silently fail — will show empty state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [organizationId, limit]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" />
            Audit Log
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="h-8 w-20 text-sm"
              min="1"
              max="500"
            />
            <Button variant="ghost" size="icon-sm" onClick={fetchLogs} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loading label="Loading audit logs..." />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No audit entries"
            description="Audit events for this organization will appear here."
          />
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
