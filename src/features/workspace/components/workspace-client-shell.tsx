'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
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
  Sparkles,
  ShieldCheck,
  AlertCircle,
  MessageSquareDashed,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { CodeViewer } from './code-viewer';
import { AgentChat } from './agent-chat';
import { DebateRoom } from './debate-room';
import { GitHubExportModal } from './github-export-modal';
import { ArchitectureVisualizerPanel } from './architecture-visualizer-panel';
import { ImageGeneratorModal } from './image-generator-modal';
import { useGenerationStream } from '../hooks/use-generation-stream';
import { useWorkspaceStatus } from '../hooks/use-workspace-status';
import { NeonButton, GlassCard } from '@/packages/ui';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'PRODUCT_MANAGER' | 'ARCHITECT' | 'DEVELOPER' | 'QA' | 'CEO';
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
  const [isTriggering, setIsTriggering] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);
  const [approvalFeedback, setApprovalFeedback] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Poll real-time pipeline status and checkpoint approvals
  const {
    currentPhase,
    phaseStatus,
    progress,
    approvalRequests,
    pendingDocument,
    refetchStatus,
  } = useWorkspaceStatus(projectId);

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
      id: 'welcome',
      sender: 'PRODUCT_MANAGER',
      content: `Welcome to **${projectName}**! The engineering team has assembled. Sarah is tracking requirements, Marcus designed the architecture, and Alex is generating the core files.`,
      timestamp: new Date(),
    },
  ]);

  useEffect(() => {
    if (!projectId) return;

    const mapActivityToMessage = (act: any): ChatMessage => {
      let sender: 'USER' | 'PRODUCT_MANAGER' | 'ARCHITECT' | 'DEVELOPER' | 'QA' | 'CEO' = 'PRODUCT_MANAGER';
      const role = String(act.agentRole || '').toUpperCase();
      
      if (role.includes('PRODUCT_MANAGER') || role.includes('PM') || role.includes('PRODUCT')) {
        sender = 'PRODUCT_MANAGER';
      } else if (role.includes('ARCHITECT')) {
        sender = 'ARCHITECT';
      } else if (role.includes('DEVELOPER') || role.includes('DEV') || role.includes('ENGINEER')) {
        sender = 'DEVELOPER';
      } else if (role.includes('QA') || role.includes('TEST')) {
        sender = 'QA';
      } else if (role.includes('CEO') || role.includes('CHIEF')) {
        sender = 'CEO';
      }
      
      let content = act.message || '';
      if (content.startsWith('[communication]')) {
        content = content.replace('[communication]', '').trim();
      } else if (content.startsWith('[handoff]')) {
        content = content.replace('[handoff]', '').trim();
      }
    
      return {
        id: act.id,
        sender,
        content,
        timestamp: new Date(),
      };
    };

    const fetchActivities = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/workspace/activity`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.activities)) {
          const mapped = [...json.activities].reverse().map(mapActivityToMessage);
          
          const welcomeMsg: ChatMessage = {
            id: 'welcome',
            sender: 'PRODUCT_MANAGER',
            content: `Welcome to **${projectName}**! The engineering team has assembled. Sarah is tracking requirements, Marcus designed the architecture, and Alex is generating the core files.`,
            timestamp: new Date(),
          };

          setMessages([welcomeMsg, ...mapped]);
        }
      } catch {
        // Ignore
      }
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 3000);
    return () => clearInterval(interval);
  }, [projectId, projectName]);

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

  const handleStartPipeline = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/lifecycle/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        toast.success('Build Pipeline Dispatched', {
          description: 'Your autonomous team is starting the spec design and file output.',
        });
      } else {
        toast.error('Trigger Failed', {
          description: json?.error?.message || 'Could not start build pipeline.',
        });
      }
    } catch {
      toast.error('Network Error', {
        description: 'Failed to contact the build gateway.',
      });
    } finally {
      setIsTriggering(false);
    }
  };
  const handleApprovePipeline = async (action: 'approve' | 'request_changes') => {
    if (approvalRequests.length === 0) return;
    setIsApproving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/pipeline/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalType: approvalRequests[0]?.artifactName || '',
          action,
          comments: approvalFeedback || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(action === 'approve' ? 'Checkpoint Approved!' : 'Changes Requested', {
          description: action === 'approve'
            ? 'Pipeline resuming. The next generation stage has started.'
            : 'AI agents are revising the specifications.',
        });
        setApprovalFeedback('');
        refetchStatus();
        fetchFiles();
      } else {
        toast.error('Approval Action Failed', {
          description: json?.error?.message || 'Failed to submit pipeline checkpoint.',
        });
      }
    } catch {
      toast.error('Network Error', {
        description: 'Failed to contact the approval gateway.',
      });
    } finally {
      setIsApproving(false);
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

          {/* Global Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white transition-all cursor-pointer shrink-0"
            title="Toggle Dashboard Theme"
          >
            {mounted && theme === 'dark' ? (
              <Sun className="w-4 h-4 text-warning" />
            ) : (
              <Moon className="w-4 h-4 text-primary" />
            )}
          </button>

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
              {approvalRequests.length === 0 && (
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
                      <span>Accept Changes</span>
                    </button>
                  )}
                </div>
              )}

              {/* Monaco Code Viewer Container */}
              <div className="flex-1 h-full shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden flex flex-col">
                {approvalRequests.length > 0 ? (
                  <div className="flex-grow flex flex-col md:flex-row h-full gap-4 p-4 bg-surface-glass/40 border border-white/10 rounded-2xl backdrop-blur-xl overflow-y-auto md:overflow-hidden">
                    {/* Left: Pending Document Review Pane */}
                    <div className="flex-[6] flex flex-col h-[380px] md:h-full bg-black/25 border border-white/5 rounded-xl p-5 overflow-hidden shrink-0">
                      <div className="flex items-center gap-2 mb-3 shrink-0">
                        <AlertCircle className="w-4 h-4 text-warning" />
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {pendingDocument?.title || approvalRequests[0]?.title || 'Pending Approval'}
                        </h3>
                      </div>
                      <div className="flex-1 overflow-y-auto scrollbar-hide bg-white/[0.02] border border-white/5 rounded-lg p-3.5">
                        {pendingDocument?.content ? (
                          typeof pendingDocument.content === 'string' ? (
                            <div className="whitespace-pre-wrap font-sans text-xs text-white/85 leading-relaxed">
                              {pendingDocument.content}
                            </div>
                          ) : (
                            <pre className="font-mono text-[10px] text-primary/80 bg-black/40 p-3 rounded-lg overflow-x-auto">
                              {JSON.stringify(pendingDocument.content, null, 2)}
                            </pre>
                          )
                        ) : (
                          <div className="text-white/40 text-xs italic py-10 text-center">
                            No document details available for review.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Approval Actions Control Card */}
                    <div className="flex-[4] flex flex-col justify-between h-auto md:h-full bg-black/45 border border-white/10 rounded-xl p-5 overflow-y-auto md:overflow-hidden shrink-0">
                      <div className="space-y-3.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-warning/10 border border-warning/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                          <span className="text-[8px] font-mono text-warning font-bold uppercase tracking-wider">
                            Executive Checkpoint
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white mb-1">
                            {approvalRequests[0]?.title || 'Approval'} Required
                          </h4>
                          <p className="text-[11px] text-white/50 leading-relaxed">
                            Sarah has assembled the requirements. Please review the documents and cast your executive validation vote.
                          </p>
                        </div>

                        {/* Optional Feedback Comments */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                            <MessageSquareDashed className="w-3 h-3" />
                            Revision Feedback (Optional)
                          </label>
                          <textarea
                            value={approvalFeedback}
                            onChange={(e) => setApprovalFeedback(e.target.value)}
                            placeholder="Add guidelines or request specific modifications..."
                            className="w-full h-20 p-2.5 rounded-xl border border-white/10 bg-white/5 text-[11px] text-white/80 placeholder-white/20 focus:outline-none focus:border-primary/50 resize-none font-sans"
                          />
                        </div>
                      </div>

                      {/* Approval Submission Buttons */}
                      <div className="space-y-2 mt-4 shrink-0">
                        <NeonButton
                          onClick={() => handleApprovePipeline('approve')}
                          isLoading={isApproving}
                          className="w-full h-10 text-xs font-bold"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                          <span>Approve & Proceed</span>
                        </NeonButton>

                        <button
                          type="button"
                          onClick={() => handleApprovePipeline('request_changes')}
                          disabled={isApproving}
                          className="w-full h-10 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          Request Changes
                        </button>
                      </div>
                    </div>
                  </div>
                ) : files.length === 0 && !isStreaming ? (
                  <div className="flex-grow flex flex-col items-center justify-center p-8 bg-surface-glass/40 border border-white/10 rounded-2xl text-center backdrop-blur-xl">
                    <Sparkles className="w-12 h-12 text-primary animate-pulse mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Assemble Team & Launch Build</h3>
                    <p className="text-xs text-white/50 max-w-sm mb-6 leading-relaxed">
                      Your autonomous developer team is configured and waiting for the launch command to start code generation.
                    </p>
                    <NeonButton
                      onClick={handleStartPipeline}
                      isLoading={isTriggering}
                      className="w-full max-w-[280px] h-12 text-xs font-bold"
                    >
                      <Play className="w-3.5 h-3.5 mr-2 fill-current" />
                      <span>Start Autonomous Build</span>
                    </NeonButton>
                  </div>
                ) : (
                  <CodeViewer
                    code={displayCode}
                    language={selectedFile?.language || 'typescript'}
                    isStreaming={isStreaming}
                    streamStatus={latestStatus}
                    tokenCount={tokenCount}
                    editorTheme={editorTheme}
                  />
                )}
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
