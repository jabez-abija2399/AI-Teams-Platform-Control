import { cn } from '@/lib/utils';

interface MonoLabelProps {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'p' | 'div' | 'label';
}

export function MonoLabel({ children, className, as: Tag = 'span' }: MonoLabelProps) {
  return (
    <Tag
      className={cn(
        'font-mono text-[11px] font-medium tracking-[0.05em] uppercase text-on-surface-variant',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
