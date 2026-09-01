import { cn } from '@/lib/utils';

interface BlueprintGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BlueprintGrid({ children, className }: BlueprintGridProps) {
  return (
    <div className={cn('relative', className)}>
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(60,73,73,0.4) 0.5px, transparent 0.5px), linear-gradient(to bottom, rgba(60,73,73,0.4) 0.5px, transparent 0.5px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
