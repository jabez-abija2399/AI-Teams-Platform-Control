'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { useEvents } from '@/features/analytics/hooks/use-events';
import type { PlatformEventInfo } from '@/features/analytics/types';
import { Activity, Clock } from 'lucide-react';

function formatTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDate(events: PlatformEventInfo[]): Map<string, PlatformEventInfo[]> {
  const groups = new Map<string, PlatformEventInfo[]>();
  for (const event of events) {
    const dateKey = new Date(event.createdAt).toISOString().split('T')[0]!;
    const group = groups.get(dateKey) ?? [];
    group.push(event);
    groups.set(dateKey, group);
  }
  return groups;
}

const TYPE_COLORS: Record<string, string> = {
  CREATE: 'bg-blue-100 text-blue-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
  DEPLOY: 'bg-green-100 text-green-800',
  ERROR: 'bg-red-100 text-red-800',
  TEST: 'bg-purple-100 text-purple-800',
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type.toUpperCase()] ?? 'bg-gray-100 text-gray-800';
}

function EventRow({ event }: { event: PlatformEventInfo }) {
  const dataPreview = event.data
    ? Object.entries(event.data)
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join(', ')
    : null;

  return (
    <div className="flex items-start gap-3 rounded-lg border px-3 py-2">
      <Badge className={getTypeColor(event.type)}>{event.type}</Badge>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{event.source}</span>
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            {formatTime(event.createdAt)}
          </span>
        </div>
        {dataPreview && (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{dataPreview}</p>
        )}
      </div>
    </div>
  );
}

export function EventTimeline({ projectId }: { projectId: string }) {
  const [typeFilter, setTypeFilter] = useState('');
  const { data: events, isLoading } = useEvents(projectId, typeFilter ? { type: typeFilter } : undefined);

  if (isLoading) return <Loading label="Loading events..." />;

  const items = events ?? [];
  const grouped = groupByDate(items);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Event Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Filter by type..."
          value={typeFilter}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTypeFilter(e.target.value)}
          className="h-7 text-xs"
        />

        {items.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No events recorded"
            description="Events will appear here as they are recorded."
          />
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([dateKey, dateEvents]) => (
              <div key={dateKey} className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium">
                  {formatDate(new Date(dateKey + 'T00:00:00'))}
                </p>
                <div className="space-y-2">
                  {dateEvents.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
