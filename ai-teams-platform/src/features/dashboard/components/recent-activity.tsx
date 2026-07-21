import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Activity as ActivityIcon } from 'lucide-react';
import { formatRelativeTime } from '@/utils/format';
import type { Activity } from '../../../../prisma/generated/prisma/client';

export function RecentActivity({ activities }: { activities: Activity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="No activity yet"
            description="Actions across your projects will show up here."
          />
        ) : (
          <ul className="space-y-4">
            {activities.map((a) => (
              <li key={a.id} className="flex items-start justify-between text-sm">
                <span>{a.action}</span>
                <span className="text-muted-foreground text-xs">
                  {formatRelativeTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
