import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  className?: string;
  label?: string;
}

export function Loading({ className, label = 'Loading…' }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
      <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}
