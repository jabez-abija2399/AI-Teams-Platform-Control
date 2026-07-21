import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, truncate } from '@/utils/format';
import { ROUTES } from '@/config/constants';
import type { Project } from '../../../../prisma/generated/prisma/client';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  PLANNING: 'outline',
  IN_PROGRESS: 'default',
  REVIEW: 'secondary',
  COMPLETED: 'secondary',
  ARCHIVED: 'outline',
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`${ROUTES.projects}/${project.id}`}>
      <Card className="hover:border-foreground/20 transition-colors">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <CardTitle className="text-sm font-medium">{project.name}</CardTitle>
          <Badge variant={STATUS_VARIANT[project.status] ?? 'outline'}>
            {project.status.replace('_', ' ')}
          </Badge>
        </CardHeader>
        <CardContent>
          {project.description && (
            <p className="text-muted-foreground text-sm">{truncate(project.description, 90)}</p>
          )}
          <p className="text-muted-foreground mt-3 text-xs">
            Updated {formatRelativeTime(project.updatedAt)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
