import { cn } from '@/lib/utils';
import { AGENT_PERSONALITY } from '../constants/agent-personality.constants';
import type { AgentRole } from '@/ai/agents/core/agent.types';

interface AgentAvatarProps {
  role: AgentRole;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
} as const;

const ICON_SIZE = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-6 w-6' } as const;

export function AgentAvatar({ role, size = 'md', showTagline = false, className }: AgentAvatarProps) {
  const persona = AGENT_PERSONALITY[role];
  const Icon = persona.icon;

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full',
          SIZE_CLASSES[size],
        )}
        style={{ backgroundColor: persona.bg, color: persona.color }}
      >
        <Icon className={ICON_SIZE[size]} />
      </span>
      {showTagline && (
        <span className="text-muted-foreground text-xs">{persona.tagline}</span>
      )}
    </div>
  );
}
