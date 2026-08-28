'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Message {
  id: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

interface ConversationPanelProps {
  projectId: string;
}

export function ConversationPanel({ projectId }: ConversationPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/projects/${projectId}/conversations`);
        if (res.ok) {
          const data = (await res.json()) as { messages: Message[] };
          setMessages(data.messages);
        }
      } catch {
        // ignore
      }
    }
    void fetchMessages();
  }, [projectId]);

  return (
    <Card className="rounded-2xl border border-border/80 glass-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-foreground">Agent Inter-Communication</CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-xs">No agent communication yet.</p>
        ) : (
          <div className="max-h-64 space-y-2.5 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className="rounded-xl border border-border/70 glass-card p-3 transition-all duration-200 hover:border-primary/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">{msg.senderName}</span>
                  <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">({msg.senderRole})</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-foreground/90">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
