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
    <Card>
      <CardHeader>
        <CardTitle>Agent Communication</CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-sm">No agent communication yet.</p>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className="rounded border p-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{msg.senderName}</span>
                  <span className="text-muted-foreground text-xs">({msg.senderRole})</span>
                </div>
                <p className="mt-1 text-sm">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
