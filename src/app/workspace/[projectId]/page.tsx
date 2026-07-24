'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAIBuildStream } from '@/hooks/use-ai-build-stream';
import { FileTree } from '@/components/workspace/file-tree';
import { CodeEditor } from '@/components/workspace/code-editor';
import { PreviewIframe } from '@/components/workspace/preview-iframe';
import { TerminalDrawer } from '@/components/workspace/terminal-drawer';
import { Play, Sparkles, Folder, Terminal as TerminalIcon } from 'lucide-react';

export default function WorkspacePage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || 'default-project';

  const {
    status,
    progress,
    currentStep,
    terminalLogs,
    generatedFiles,
    previewUrl,
    activeFilePath,
    setActiveFilePath,
    updateFileContent,
    triggerBuild,
    clearLogs,
  } = useAIBuildStream(projectId);

  const [promptInput, setPromptInput] = useState('');

  const handleRunBuild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    triggerBuild(promptInput);
  };

  const activeContent = activeFilePath ? generatedFiles[activeFilePath] || '' : '';

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar Header */}
      <header className="h-14 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-sky-950/80 border border-sky-800 text-sky-400 rounded-md text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Workspace</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Project ID: {projectId}</span>
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleRunBuild} className="flex-1 max-w-2xl mx-6 flex items-center gap-2">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Describe a feature or component to build (e.g. Build an auth form)..."
            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
          <button
            type="submit"
            disabled={status === 'ARCHITECT_PLANNING' || status === 'GENERATING_CODE' || status === 'QA_VERIFYING'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Build</span>
          </button>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
            {status} ({progress}%)
          </span>
        </div>
      </header>

      {/* Main Resizable Workspace Grid */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-56 shrink-0 h-full">
            <FileTree
              files={generatedFiles}
              activeFilePath={activeFilePath}
              onSelectFile={setActiveFilePath}
              onNewFile={(path) => {
                updateFileContent(path, '// New file\n');
                setActiveFilePath(path);
              }}
            />
          </div>

          {/* Monaco Code Editor Area */}
          <div className="flex-1 h-full min-w-0">
            <CodeEditor
              activeFilePath={activeFilePath}
              fileContent={activeContent}
              onCodeChange={(newCode) => {
                if (activeFilePath) {
                  updateFileContent(activeFilePath, newCode);
                }
              }}
            />
          </div>

          {/* Live Preview Panel */}
          <div className="w-[450px] shrink-0 h-full">
            <PreviewIframe
              previewUrl={previewUrl}
              status={status}
              progress={progress}
              currentStep={currentStep}
              projectId={projectId}
            />
          </div>
        </div>

        {/* Terminal Drawer Footer */}
        <TerminalDrawer logs={terminalLogs} onClearLogs={clearLogs} />
      </div>
    </div>
  );
}
