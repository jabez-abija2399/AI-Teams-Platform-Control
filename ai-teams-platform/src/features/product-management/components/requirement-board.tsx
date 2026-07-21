'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { ClipboardList } from 'lucide-react';

interface Requirement {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
}

const COLUMNS: { status: string; label: string; color: string }[] = [
  { status: 'IDEA', label: 'Idea', color: 'bg-slate-100 border-slate-300' },
  { status: 'PLANNED', label: 'Planned', color: 'bg-blue-50 border-blue-300' },
  { status: 'IN_DEVELOPMENT', label: 'In Development', color: 'bg-amber-50 border-amber-300' },
  { status: 'TESTING', label: 'Testing', color: 'bg-purple-50 border-purple-300' },
  { status: 'RELEASED', label: 'Released', color: 'bg-emerald-50 border-emerald-300' },
];

function priorityVariant(priority: string) {
  switch (priority) {
    case 'URGENT':
      return 'destructive';
    case 'HIGH':
      return 'default';
    case 'MEDIUM':
      return 'secondary';
    case 'LOW':
      return 'outline';
    default:
      return 'secondary';
  }
}

function categoryVariant(category: string) {
  switch (category) {
    case 'FUNCTIONAL':
      return 'default';
    case 'NON_FUNCTIONAL':
      return 'secondary';
    case 'TECHNICAL':
      return 'outline';
    case 'UX':
      return 'destructive';
    default:
      return 'secondary';
  }
}

interface RequirementBoardProps {
  requirements: Requirement[];
}

export function RequirementBoard({ requirements }: RequirementBoardProps) {
  if (requirements.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No requirements yet"
        description="Materialize requirements from your product vision to see them here."
      />
    );
  }

  return (
    <div className="grid grid-cols-5 gap-4 overflow-x-auto">
      {COLUMNS.map((col) => {
        const items = requirements.filter((r) => r.status === col.status);
        return (
          <div key={col.status} className="min-w-[220px]">
            <div className={cn('mb-3 rounded-lg border-2 border-dashed p-3', col.color)}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                {col.label}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">{items.length} items</p>
            </div>
            <div className="space-y-2">
              {items.map((req) => (
                <Card key={req.id} className="cursor-default shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm leading-snug">{req.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3 pt-0">
                    <p className="text-muted-foreground line-clamp-2 text-xs">{req.description}</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={priorityVariant(req.priority)} className="text-[10px]">
                        {req.priority}
                      </Badge>
                      <Badge variant={categoryVariant(req.category)} className="text-[10px]">
                        {req.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
