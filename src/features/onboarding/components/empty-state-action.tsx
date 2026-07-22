import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AgentAvatar } from './agent-avatar';
import type { AgentRole } from '@/ai/agents/core/agent.types';

interface EmptyStateActionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  agentRole?: AgentRole;
  actions: { label: string; onClick: () => void; variant?: 'default' | 'outline' }[];
  className?: string;
}

export function EmptyStateAction({ icon: Icon, title, description, agentRole, actions, className }: EmptyStateActionProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center',
        className,
      )}
    >
      {agentRole ? (
        <AgentAvatar role={agentRole} size="lg" />
      ) : (
        <div className="bg-muted mb-4 rounded-full p-3">
          <Icon className="text-muted-foreground h-6 w-6" />
        </div>
      )}
      <h3 className="mt-3 text-sm font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-xs">{description}</p>
      {actions.length > 0 && (
        <div className="mt-4 flex gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              onClick={action.onClick}
              size="sm"
              variant={action.variant ?? 'default'}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
