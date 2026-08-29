'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentAvatar } from '@/packages/ui';
import { fadeUpVariant, staggerContainer } from '@/packages/motion';
import { sanitizeHtml } from '@/lib/security/sanitize';
import { Send, Sparkles, Bot, X } from 'lucide-react';

interface Message {
  id: string;
  sender: 'USER' | 'PRODUCT_MANAGER' | 'ARCHITECT' | 'DEVELOPER' | 'QA' | 'CEO';
  content: string;
  timestamp: Date;
}

interface AgentChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isAgentTyping?: boolean;
  onClose?: () => void;
}

export function AgentChat({ messages, onSendMessage, isAgentTyping = false, onClose }: AgentChatProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAgentTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const MotionDiv = motion.div as any;

  return (
    <div className="w-full h-full flex flex-col p-0 border border-white/10 bg-surface glass-card rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-surface-container-high/60 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <AgentAvatar role="PRODUCT_MANAGER" isActive={isAgentTyping} size="sm" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight font-heading">Sarah</h3>
            <p className="text-[10px] text-primary uppercase tracking-widest font-mono font-bold">Product Manager</p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/10 text-on-surface-variant hover:text-white hover:border-white/30 transition-all"
            title="Close AI Chat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        <MotionDiv variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isUser = msg.sender === 'USER';

              return (
                <MotionDiv
                  key={msg.id}
                  variants={fadeUpVariant}
                  layout
                  className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[85%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isUser && (
                      <div className="flex-shrink-0 mt-1">
                        <AgentAvatar role={msg.sender as any} size="sm" />
                      </div>
                    )}

                    <div
                      className={`p-4 rounded-xl relative ${
                        isUser
                          ? 'bg-primary/20 border border-primary/40 text-white rounded-tr-none font-mono text-xs'
                          : 'bg-surface-container-high border border-white/10 text-white/90 rounded-tl-none font-mono text-xs leading-relaxed'
                      }`}
                    >
                      {!isUser ? (
                        <div
                          className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-background prose-pre:border prose-pre:border-white/10"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.content) }}
                        />
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </div>
                </MotionDiv>
              );
            })}
          </AnimatePresence>

          {isAgentTyping && (
            <div className="flex items-center gap-3">
              <AgentAvatar role="DEVELOPER" isActive size="sm" />
              <div className="bg-surface-container-high border border-white/10 p-3 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-mono text-primary font-bold">Alex is coding solution…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </MotionDiv>
      </div>

      {/* Submit Input Dock */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-surface-container-high/40 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Send prompt or request refactor..."
          className="flex-1 bg-background border border-white/10 px-4 py-2.5 font-mono text-xs text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="bg-primary text-background font-mono text-xs font-bold p-2.5 border border-primary hover:bg-transparent hover:text-primary transition-all flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
