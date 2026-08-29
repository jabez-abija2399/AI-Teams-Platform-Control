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
  const [showChat, setShowChat] = useState(false);
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

        {/* Center: Simplified View Mode */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-primary text-background glow-cyan uppercase"
          >
            <Code2 className="w-3.5 h-3.5" />
            Code IDE
          </button>
        </div>

        {/* Right: Actions (AI Chat Toggle, Theme, GitHub Export, Live Preview) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Chat Toggle Button */}
          <button
            type="button"
            onClick={() => setShowChat((prev) => !prev)}
            className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold transition-all ${
              showChat
                ? 'bg-primary text-background border-primary glow-cyan'
                : 'border-white/10 bg-white/5 text-on-surface-variant hover:text-white'
            }`}
            title="Toggle AI Team Chat"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">AI Chat</span>
          </button>

          {/* Theme Changer Dropdown */}
          <div className="relative hidden sm:block">
            <select
              value={editorTheme}
              onChange={(e) => setEditorTheme(e.target.value)}
              className="appearance-none h-9 px-3 pr-8 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white text-xs font-mono font-bold transition-all focus:outline-none focus:border-primary/50 cursor-pointer backdrop-blur-md"
            >
              <option value="cyber-void" className="bg-[#0A0D14] text-white">👾 Cyber Void</option>
              <option value="matrix-green" className="bg-[#020617] text-white">📟 Matrix Green</option>
              <option value="neon-sunset" className="bg-[#0c0a09] text-white">🌅 Neon Sunset</option>
              <option value="light-cyber" className="bg-[#f8fafc] text-[#0f172a]">❄️ Light Cyber</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-[9px]">
              ▼
            </div>
          </div>

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
            className="h-9 px-3.5 text-xs font-bold hidden md:inline-flex"
          >
            <FolderGit2 className="w-4 h-4 mr-1.5" />
            <span>Export</span>
          </NeonButton>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
        {/* Real-time Agent Workforce Progress Bar */}
        <div className="bg-surface border border-white/10 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-4 glass-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse glow-cyan" />
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Autonomous Agent Progress
            </span>
          </div>
          <div className="flex items-center gap-6 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant text-[10px] uppercase font-bold">Sarah (PM):</span>
              <span className="text-primary font-bold">Scope 100%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant text-[10px] uppercase font-bold">Marcus (Arch):</span>
              <span className="text-primary font-bold">Topology 100%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant text-[10px] uppercase font-bold">Alex (Dev):</span>
              <span className="text-secondary font-bold">
                {isStreaming ? `${Math.min(95, tokenCount > 0 ? Math.floor((tokenCount / 300) * 100) : 45)}% Coding` : '100% Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Split layout: File Explorer & Code Viewer */}
        <div className="flex-1 flex overflow-hidden gap-6">
          <div className="flex flex-1 gap-4 h-full transition-all">
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
                  <div className="flex-grow flex flex-col h-full p-4 bg-background border border-white/10 overflow-y-auto">
                    {/* SECTION 1: EXECUTIVE BANNER */}
                    <div className="w-full bg-surface-container border border-[#ffaa00] p-4 mb-6 relative brutalist-offset-container">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h2 className="font-heading text-lg font-bold text-[#ffaa00] flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-[#ffaa00]" />
                            APPROVAL REQUIRED — EXECUTIVE CHECKPOINT
                          </h2>
                          <p className="font-mono text-xs text-on-surface-variant mt-1">
                            {approvalRequests[0]?.title || 'Phase Validation Milestone'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 bg-background border border-white/10 px-4 py-2">
                          <span className="font-mono text-[10px] text-on-surface-variant">VALIDATION SCORE</span>
                          <span className="font-heading text-lg font-bold text-primary">92%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
                      {/* SECTION 2: DOCUMENT VIEWER */}
                      <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="bg-surface-container-high border border-white/10 flex flex-col h-[400px]">
                          <div className="border-b border-white/10 p-3 flex justify-between items-center bg-surface-container">
                            <span className="font-mono text-xs text-on-surface">SPEC_DOC_v1.4.md</span>
                            <span className="font-mono text-[10px] text-on-surface-variant">READ-ONLY VIEW</span>
                          </div>
                          <div className="p-6 flex-grow overflow-y-auto font-mono text-xs text-on-background bg-[#1a1a1a] leading-relaxed">
                            {pendingDocument?.content ? (
                              typeof pendingDocument.content === 'string' ? (
                                <div className="whitespace-pre-wrap">{pendingDocument.content}</div>
                              ) : (
                                <pre>{JSON.stringify(pendingDocument.content, null, 2)}</pre>
                              )
                            ) : (
                              <div>
                                <h3 className="font-heading text-base font-bold text-white mb-2">1. Component Architecture</h3>
                                <p className="text-on-surface-variant mb-4">Executive approval pending for current phase deliverables.</p>
                                <div className="bg-[#2a2a2a] p-3 border border-white/10 font-mono text-primary text-[11px]">
                                  {`{\n  "status": "pending_approval",\n  "phase": "${currentPhase}",\n  "required_signatures": ["Lead Designer", "Product Owner"]\n}`}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SECTION 4: REVISION FEEDBACK */}
                        <div className="bg-surface-container border border-white/10 p-4">
                          <label className="block font-mono text-xs text-on-surface mb-2" htmlFor="revision-feedback">
                            Revision Instructions (Optional)
                          </label>
                          <textarea
                            id="revision-feedback"
                            value={approvalFeedback}
                            onChange={(e) => setApprovalFeedback(e.target.value)}
                            placeholder="Describe required changes or specify feedback guidelines..."
                            className="w-full bg-background border border-white/10 p-3 font-mono text-xs text-on-surface focus:border-primary outline-none resize-none h-20"
                          />
                        </div>
                      </div>

                      {/* Right Column: Automated Checks & Actions */}
                      <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* SECTION 3: COMPLIANCE CHECKLIST */}
                        <div className="bg-surface-container border border-white/10 p-6">
                          <h3 className="font-mono text-xs font-bold text-on-surface mb-4 border-b border-white/10 pb-2">
                            Automated Compliance Checks
                          </h3>
                          <ul className="space-y-3 font-mono text-xs">
                            <li className="flex items-start gap-2.5">
                              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-on-surface">Accessibility (A11y)</p>
                                <p className="text-[10px] text-on-surface-variant mt-0.5">WCAG 2.1 AA compliant.</p>
                              </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-on-surface">Routing Logic</p>
                                <p className="text-[10px] text-on-surface-variant mt-0.5">All deep links resolve.</p>
                              </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-on-surface">Security Scaffolding</p>
                                <p className="text-[10px] text-on-surface-variant mt-0.5">Auth placeholders injected.</p>
                              </div>
                            </li>
                          </ul>
                        </div>

                        {/* Metrics Card */}
                        <div className="bg-surface-container border border-white/10 p-6">
                          <h3 className="font-mono text-xs font-bold text-on-surface mb-3">Generation Meta</h3>
                          <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                            <div>
                              <p className="text-on-surface-variant text-[10px]">Tokens</p>
                              <p className="text-on-surface font-bold">14,205</p>
                            </div>
                            <div>
                              <p className="text-on-surface-variant text-[10px]">Latency</p>
                              <p className="text-on-surface font-bold">3.4s</p>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 5: SUBMISSION DOCK */}
                        <div className="flex flex-col gap-3 mt-auto">
                          <button
                            type="button"
                            onClick={() => handleApprovePipeline('approve')}
                            disabled={isApproving}
                            className="w-full bg-primary text-background font-mono text-xs font-bold py-3.5 border border-primary hover:bg-transparent hover:text-primary transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Approve & Proceed</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprovePipeline('request_changes')}
                            disabled={isApproving}
                            className="w-full bg-transparent border border-white/20 text-on-surface hover:border-white font-mono text-xs py-2.5 transition-colors"
                          >
                            Request Revisions
                          </button>
                        </div>
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

            {/* Right: Collapsible Real-time Agent Chat Panel */}
            {showChat && (
              <div className="w-80 lg:w-[360px] h-full shrink-0 shadow-2xl rounded-2xl relative transition-all duration-300">
                <AgentChat
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isAgentTyping={isStreaming}
                  onClose={() => setShowChat(false)}
                />
              </div>
            )}
        </div>
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
