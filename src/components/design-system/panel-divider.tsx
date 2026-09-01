import { cn } from '@/lib/utils';

interface PanelDividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function PanelDivider({ orientation = 'horizontal', className }: PanelDividerProps) {
  return (
    <div
      className={cn(
        orientation === 'horizontal'
          ? 'h-px w-full bg-outline-variant/60'
          : 'w-px h-full bg-outline-variant/60',
        className,
      )}
      role="separator"
      aria-orientation={orientation}
    />
  );
}
