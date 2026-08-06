import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center',
        className,
      )}
    >
      <div className="mb-4 rounded-2xl bg-primary/10 p-4 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && (
        <Button onClick={action.onClick} size="sm" className="mt-5 rounded-xl">
          {action.label}
        </Button>
      )}
    </div>
  );
}
