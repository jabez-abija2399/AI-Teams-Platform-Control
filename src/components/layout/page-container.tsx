import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn('mx-auto w-full max-w-6xl space-y-7', className)}>{children}</div>;
}
