'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FolderGit2,
  Play,
  MessageSquare,
  Code2,
  Users2,
  ExternalLink,
  Sparkles,
  Network,
  Wand2,
  Image as ImageIcon,
} from 'lucide-react';
import { CodeViewer } from './code-viewer';
import { AgentChat } from './agent-chat';
import { DebateRoom } from './debate-room';
import { GitHubExportModal } from './github-export-modal';
import { ArchitectureVisualizerPanel } from './architecture-visualizer-panel';
import { ImageGeneratorModal } from './image-generator-modal';
import { useGenerationStream } from '../hooks/use-generation-stream';
import { NeonButton } from '@/packages/ui';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'PRODUCT_MANAGER' | 'ARCHITECT';
  content: string;
  timestamp: Date;
}

interface WorkspaceClientShellProps {
  projectId: string;
  projectName: string;
}

export function WorkspaceClientShell({ projectId, projectName }: WorkspaceClientShellProps) {
  const [activeTab, setActiveTab] = useState<'ide' | 'chat' | 'debate' | 'architecture'>('ide');
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Consume live SSE tokens from the generation stream bus
  const { tokens, isStreaming, latestStatus, tokenCount } = useGenerationStream(projectId);

  const defaultMockCode = `import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

/**
 * AI Generated Authentication Gateway
 * Produced by Alex (Lead Developer) & Reviewed by Marcus (Architect)
 */
export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }: any) {
      session.user.id = token.sub;
      return session;
    },
  },
};

export default NextAuth(authOptions);`;

  const displayCode = tokens.trim().length > 0 ? tokens : defaultMockCode;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'PRODUCT_MANAGER',
      content: `Welcome to **${projectName}**! The engineering team has assembled. Sarah is tracking requirements, Marcus designed the architecture, and Alex is generating the core files.`,
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'USER',
        content,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-void overflow-hidden text-white font-sans">
      {/* Workspace Top Action Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-surface-glass/80 backdrop-blur-xl shrink-0 z-10 shadow-lg">
        {/* Left: Project title & Back link */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ai-teams" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-5 w-px bg-white/10" />
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              {projectName}
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                Live Studio
              </span>
            </h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
              Autonomous AI Engineering Workspace
            </p>
          </div>
        </div>

        {/* Center: Workspace View Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab('ide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ide'
                ? 'bg-primary text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Monaco IDE
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-primary text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            AI Team Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('debate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'debate'
                ? 'bg-primary text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            Debate Arena
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'architecture'
                ? 'bg-primary text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Architecture
          </button>
        </div>

        {/* Right: Actions (Free AI Images, GitHub Export, Live Preview) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsImageModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/20 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Images</span>
          </button>

          <Link href={`/preview/${projectId}`} target="_blank">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-success/30 bg-success/10 text-success hover:bg-success/20 text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Live Preview</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </button>
          </Link>

          <NeonButton
            variant="secondary"
            onClick={() => setIsGitHubModalOpen(true)}
            className="h-9 px-3.5 text-xs font-bold"
          >
            <FolderGit2 className="w-4 h-4 mr-1.5" />
            <span>Export to GitHub</span>
          </NeonButton>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6">
        {activeTab === 'architecture' ? (
          <ArchitectureVisualizerPanel projectName={projectName} />
        ) : activeTab === 'debate' ? (
          <DebateRoom />
        ) : (
          <>
            {/* Left 70%: Monaco Code Viewer */}
            <div
              className={`flex flex-col flex-[7] h-full shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl transition-all ${
                activeTab === 'chat' ? 'hidden md:flex' : 'flex'
              }`}
            >
              <CodeViewer
                code={displayCode}
                language="typescript"
                isStreaming={isStreaming}
                streamStatus={latestStatus}
                tokenCount={tokenCount}
              />
            </div>

            {/* Right 30%: Real-time Agent Chat Panel */}
            <div
              className={`flex flex-col flex-1 md:flex-[3] h-full shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl relative ${
                activeTab === 'ide' ? 'hidden md:flex' : 'flex'
              }`}
            >
              <AgentChat
                messages={messages}
                onSendMessage={handleSendMessage}
                isAgentTyping={isStreaming}
              />
            </div>
          </>
        )}
      </main>

      {/* GitHub Export Modal */}
      <GitHubExportModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        projectId={projectId}
        projectName={projectName}
      />

      {/* Free AI Image & Asset Generator Modal */}
      <ImageGeneratorModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        projectName={projectName}
      />
    </div>
  );
}
