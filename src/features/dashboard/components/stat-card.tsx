import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, hint, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/80 glass-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 transition-all duration-200 group-hover:scale-105 group-hover:bg-primary/20">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="font-heading mt-3 text-3xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
      {hint && <p className="mt-1.5 text-xs font-medium text-muted-foreground/80">{hint}</p>}
    </div>
  );
}
