import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  sidebar?: React.ReactNode;
}

/** Main application shell with optional sidebar */
export function AppShell({ children, className, sidebar }: AppShellProps) {
  return (
    <div className={cn('flex min-h-screen bg-background', className)}>
      {sidebar}
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}
