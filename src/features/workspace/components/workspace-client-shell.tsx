'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FolderGit2,
  Play,
  MessageSquare,
  Code2,
  Users2,
  ExternalLink,
  Wand2,
  Folder,
  FileCode,
  CheckCircle,
  Loader2,
  Network,
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

interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  language?: string;
  reviewStatus?: 'pending' | 'accepted' | 'modified';
}

interface WorkspaceClientShellProps {
  projectId: string;
  projectName: string;
}

export function WorkspaceClientShell({ projectId, projectName }: WorkspaceClientShellProps) {
  const [activeTab, setActiveTab] = useState<'ide' | 'chat' | 'debate' | 'architecture'>('ide');
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editorTheme, setEditorTheme] = useState<string>('cyber-void');

  // File explorer states
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [fileCode, setFileCode] = useState<string>('');
  const [loadingCode, setLoadingCode] = useState(false);

  // Consume live SSE tokens from the generation stream bus
  const { tokens, isStreaming, latestStatus, tokenCount } = useGenerationStream(projectId);

  // Fetch the project files structure from explorer endpoint
  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/explorer`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setFiles(json.data);
        // Pre-select the first file if none is selected
        const firstFile = json.data.find((f: ProjectFile) => f.type === 'file');
        if (firstFile && !selectedFile) {
          setSelectedFile(firstFile);
        }
      }
    } catch (err) {
      console.error('Failed to load project files:', err);
    } finally {
      setLoadingFiles(false);
    }
  }, [projectId, selectedFile]);

  // Load files on mount
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Trigger file list refresh when streaming stops to grab newly generated files
  useEffect(() => {
    if (!isStreaming) {
      fetchFiles();
    }
  }, [isStreaming, fetchFiles]);

  // Load the content of the selected file
  useEffect(() => {
    if (!selectedFile) return;

    let isMounted = true;
    const fetchFileContent = async () => {
      setLoadingCode(true);
      try {
        const res = await fetch(
          `/api/editor/file/${selectedFile.id}?projectId=${projectId}`,
        );
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setFileCode(json.data.content || '');
        }
      } catch (err) {
        console.error('Failed to load file content:', err);
      } finally {
        if (isMounted) setLoadingCode(false);
      }
    };

    fetchFileContent();

    return () => {
      isMounted = false;
    };
  }, [selectedFile, projectId]);

  const defaultMockCode = `// Ready to build the project. Click trigger to begin.`;
  const displayCode = isStreaming
    ? tokens
    : fileCode || defaultMockCode;

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

  const handleAcceptChanges = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/explorer/review`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        // Reload files to get accepted statuses
        fetchFiles();
      }
    } catch {
      // Ignore
    }
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
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 animate-pulse">
                {isStreaming ? 'Generating...' : 'Live Studio'}
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
          {/* Theme Changer Dropdown */}
          <div className="relative">
            <select
              value={editorTheme}
              onChange={(e) => setEditorTheme(e.target.value)}
              className="appearance-none h-9 px-3 pr-8 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white text-xs font-mono font-bold transition-all focus:outline-none focus:border-primary/50 cursor-pointer backdrop-blur-md"
            >
              <option value="cyber-void" className="bg-[#05050A] text-white">👾 Cyber Void</option>
              <option value="matrix-green" className="bg-[#05050A] text-white">📟 Matrix Green</option>
              <option value="neon-sunset" className="bg-[#05050A] text-white">🌅 Neon Sunset</option>
              <option value="light-cyber" className="bg-[#f8fafc] text-[#0f172a]">❄️ Light Cyber</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-[9px]">
              ▼
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsImageModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/20 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-pulse"
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
            {/* Split layout: File Explorer (left) & Monaco Viewer (center) */}
            <div
              className={`flex flex-1 lg:flex-[7] gap-4 h-full transition-all ${
                activeTab === 'chat' ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* File Explorer Tree */}
              <div className="w-56 bg-surface-glass/40 border border-white/10 rounded-2xl p-4 flex flex-col shrink-0">
                <p className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-3">
                  Workspace Files
                </p>
                {loadingFiles ? (
                  <div className="flex items-center gap-2 text-xs text-white/30 font-mono py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide">
                    {files.map((file) => {
                      const isSelected = selectedFile?.id === file.id;
                      return (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => {
                            if (file.type === 'file') setSelectedFile(file);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                            isSelected
                              ? 'bg-primary/20 text-white border border-primary/30'
                              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {file.type === 'folder' ? (
                              <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : (
                              <FileCode className="w-3.5 h-3.5 text-primary shrink-0" />
                            )}
                            <span className="truncate">{file.name}</span>
                          </div>
                          {file.reviewStatus === 'pending' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Approve toolbar for pending files */}
                {files.some((f) => f.reviewStatus === 'pending') && (
                  <button
                    type="button"
                    onClick={handleAcceptChanges}
                    className="w-full mt-4 py-2 rounded-xl border border-success/30 bg-success/10 text-success hover:bg-success/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Accept Changes
                  </button>
                )}
              </div>

              {/* Monaco Code Viewer Container */}
              <div className="flex-1 h-full shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden">
                <CodeViewer
                  code={displayCode}
                  language={selectedFile?.language || 'typescript'}
                  isStreaming={isStreaming}
                  streamStatus={latestStatus}
                  tokenCount={tokenCount}
                  editorTheme={editorTheme}
                />
              </div>
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
