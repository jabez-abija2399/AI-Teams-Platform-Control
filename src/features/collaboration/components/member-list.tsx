import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';

interface Member {
  id: string;
  type: string;
  role: string;
  user?: { name: string; email: string } | null;
  agent?: { name: string; role: string } | null;
}

interface MemberListProps {
  members: Member[];
}

export function MemberList({ members }: MemberListProps) {
  if (!members.length) {
    return <p className="text-muted-foreground py-4 text-center text-sm">No members yet.</p>;
  }

  return (
    <div className="space-y-1">
      {members.map((m) => (
        <div key={m.id} className="flex items-center gap-2.5 rounded-md p-2 hover:bg-muted/50">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">
              {m.type === 'AI_AGENT' ? <Bot className="h-3.5 w-3.5" /> : (m.user?.name ?? '?')[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">
              {m.type === 'AI_AGENT' ? m.agent?.name : m.user?.name}
            </p>
            {m.user?.email && (
              <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
            )}
          </div>
          <Badge variant="outline" className="shrink-0">{m.role}</Badge>
        </div>
      ))}
    </div>
  );
}
