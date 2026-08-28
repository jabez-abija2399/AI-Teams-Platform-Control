'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, AgentAvatar, NeonButton } from '@/packages/ui';
import { fadeUpVariant, staggerContainer } from '@/packages/motion';
import { sanitizeHtml } from '@/lib/security/sanitize';
import { Send, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  sender: 'USER' | 'PRODUCT_MANAGER' | 'ARCHITECT';
  content: string;
  timestamp: Date;
}

interface AgentChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isAgentTyping?: boolean;
}

export function AgentChat({ messages, onSendMessage, isAgentTyping = false }: AgentChatProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom whenever a new message appears or an agent starts typing
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
  const MotionForm = motion.form as any;

  return (
    <GlassCard className="w-full h-full flex flex-col p-0 border-white/5 overflow-hidden bg-surface-glass/80">
      
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-white/5 backdrop-blur-md z-10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <AgentAvatar role="PRODUCT_MANAGER" isActive={isAgentTyping} size="sm" />
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Sarah</h3>
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Product Manager</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        <MotionDiv
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6"
        >
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
                    
                    {/* Avatar */}
                    {!isUser && (
                      <div className="flex-shrink-0 mt-1">
                        <AgentAvatar role={msg.sender as any} size="sm" />
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div className={`
                      p-4 rounded-2xl relative
                      ${isUser 
                        ? 'bg-primary/20 border border-primary/30 text-white rounded-tr-sm' 
                        : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'
                      }
                    `}>
                      {/* If it's from the agent, safely render any markdown/HTML they sent */}
                      {!isUser ? (
                        <div 
                          className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.content) }}
                        />
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                      
                      <span className="text-[9px] text-white/30 font-mono absolute bottom-1 right-3">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                  </div>
                </MotionDiv>
              );
            })}

            {/* Typing Indicator */}
            {isAgentTyping && (
              <MotionDiv
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex w-full justify-start"
              >
                <div className="flex gap-3">
                  <AgentAvatar role="PRODUCT_MANAGER" isActive={true} size="sm" />
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 flex items-center gap-1.5 h-12">
                    <MotionDiv animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-primary/80" />
                    <MotionDiv animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-primary/80" />
                    <MotionDiv animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-primary/80" />
                  </div>
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionDiv>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#05050A]/80 backdrop-blur-xl border-t border-white/5">
        <MotionForm 
          onSubmit={handleSubmit}
          className="relative flex items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Message Sarah (Product Manager)..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isAgentTyping}
            className="absolute right-2 p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </MotionForm>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-white/30 font-mono uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          AI responses are generated in real-time
        </div>
      </div>

    </GlassCard>
  );
}
