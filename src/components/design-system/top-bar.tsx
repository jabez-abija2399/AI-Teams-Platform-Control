import { cn } from '@/lib/utils';
import { MonoLabel } from './mono-label';

interface TopBarProps {
  breadcrumb?: string[];
  title?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function TopBar({ breadcrumb, title, actions, className }: TopBarProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between h-14 px-6 border-b border-outline bg-surface shrink-0',
        className,
      )}
    >
      <div className="flex flex-col gap-0.5">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-2">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-on-surface-variant opacity-40">/</span>}
                <MonoLabel className={i === breadcrumb.length - 1 ? 'text-primary' : ''}>
                  {crumb}
                </MonoLabel>
              </span>
            ))}
          </div>
        )}
        {title && (
          <h1 className="font-sans text-sm font-semibold text-foreground">{title}</h1>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
