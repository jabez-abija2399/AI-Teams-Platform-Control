'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Send, Copy, Check, Sparkles, Trash2 } from 'lucide-react';
import { useCodeAssistant } from '../hooks/use-assistant';
import type { CodeAssistantMessage, CodeContext } from '../types';

interface AssistantChatProps {
  projectId: string;
  context?: CodeContext;
  onApplyCode?: (code: string, language: string) => void;
}

export function AssistantChat({ projectId, context, onApplyCode }: AssistantChatProps) {
  const [messages, setMessages] = useState<CodeAssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mutation = useCodeAssistant();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || mutation.isPending) return;

    const userMsg: CodeAssistantMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await mutation.mutateAsync({
        projectId,
        message: text,
        context,
        history,
      });

      const assistantMsg: CodeAssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: CodeAssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleClear() {
    setMessages([]);
  }

  function extractCodeBlocks(content: string): { text: string; code: string; language: string }[] {
    const parts: { text: string; code: string; language: string }[] = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: content.slice(lastIndex, match.index), code: '', language: '' });
      }
      parts.push({ text: '', code: match[2]?.trim() ?? '', language: match[1] || 'text' });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ text: content.slice(lastIndex), code: '', language: '' });
    }

    return parts;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span className="text-xs font-medium">Code Assistant</span>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClear}>
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles className="mb-2 h-8 w-8 text-violet-500/40" />
            <p className="text-xs font-medium text-muted-foreground">Ask anything about your code</p>
            <p className="mt-1 text-[11px] text-muted-foreground/60">
              Ctrl+L to focus • Context-aware
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`group ${msg.role === 'user' ? 'text-right' : ''}`}>
            <div
              className={`inline-block max-w-[95%] rounded-lg px-3 py-2 text-xs ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="space-y-2">
                  {extractCodeBlocks(msg.content).map((part, i) =>
                    part.code ? (
                      <div key={i} className="relative">
                        <div className="flex items-center justify-between rounded-t bg-background/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                          <span>{part.language}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleCopy(part.code, `${msg.id}-${i}`)}
                              className="rounded p-0.5 hover:bg-secondary"
                            >
                              {copiedId === `${msg.id}-${i}` ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                            {onApplyCode && (
                              <button
                                onClick={() => onApplyCode(part.code, part.language)}
                                className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-600 hover:bg-violet-500/20"
                              >
                                Apply
                              </button>
                            )}
                          </div>
                        </div>
                        <pre className="overflow-x-auto rounded-b bg-background/50 p-2 text-[11px] leading-relaxed">
                          <code>{part.code}</code>
                        </pre>
                      </div>
                    ) : (
                      <p key={i} className="whitespace-pre-wrap leading-relaxed">{part.text}</p>
                    ),
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {mutation.isPending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loading label="" className="h-3 w-3" />
            <span>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-2">
        {context?.fileName && (
          <div className="mb-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <span>Context: {context.fileName}</span>
            {context.selectedText && <span>• Selection active</span>}
          </div>
        )}
        <div className="flex items-end gap-1.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code..."
            rows={1}
            className="flex-1 resize-none rounded-md border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
            style={{ minHeight: 32, maxHeight: 120 }}
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || mutation.isPending}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
