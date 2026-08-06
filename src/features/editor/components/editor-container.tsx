'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import { MonacoEditorWrapper } from './monaco-editor';
import type { MonacoEditorHandle } from './monaco-editor';
import { EditorToolbar } from './editor-toolbar';
import { LanguageSelector } from './language-selector';
import { CommandPalette } from './command-palette';
import dynamic from 'next/dynamic';
import { useEditor } from '../hooks/use-editor';
import { useCommandPaletteActions } from '../hooks/use-command-palette-actions';
import { detectLanguage } from '../utils/language-detector';

const LivePreview = dynamic(
  () => import('@/features/workspace/preview/components/live-preview').then((m) => ({ default: m.LivePreview })),
  { ssr: false },
);

export function EditorContainer() {
  const { openTabs, activeTabId, setActiveTab, closeTab } = useWorkspaceStore();
  const {
    activeState,
    preferences,
    isLoading,
    loadFile,
    handleContentChange,
    save,
    updateCursorPosition,
    updatePreferences,
    saveViewState,
  } = useEditor();

  const editorRef = useRef<MonacoEditorHandle>(null);
  const loadedTabsRef = useRef<Set<string>>(new Set());
  const [manualOverrides, setManualOverrides] = useState<Record<string, string>>({});

  const activeTab = openTabs.find((t) => t.id === activeTabId);
  const activeLanguage = (activeTabId && manualOverrides[activeTabId])
    ?? (activeTab ? detectLanguage(activeTab.path) : 'plaintext');

  const handleSave = useCallback(() => {
    save();
  }, [save]);

  const handleFormat = useCallback(() => {
    const editor = editorRef.current?.getEditor();
    if (editor) {
      editor.getAction('editor.action.formatDocument')?.run();
    }
  }, []);

  const handleUndo = useCallback(() => {
    const editor = editorRef.current?.getEditor();
    if (editor) {
      editor.trigger('keyboard', 'undo', null);
    }
  }, []);

  const handleRedo = useCallback(() => {
    const editor = editorRef.current?.getEditor();
    if (editor) {
      editor.trigger('keyboard', 'redo', null);
    }
  }, []);

  const handleLanguageChange = useCallback((lang: string) => {
    if (activeTabId) {
      setManualOverrides((prev) => ({ ...prev, [activeTabId]: lang }));
    }
  }, [activeTabId]);

  useCommandPaletteActions({
    onSave: handleSave,
    preferences,
    onUpdatePreferences: updatePreferences,
  });

  useEffect(() => {
    if (!activeTabId) return;
    const tab = openTabs.find((t) => t.id === activeTabId);
    if (!tab) return;

    if (!loadedTabsRef.current.has(activeTabId)) {
      loadedTabsRef.current.add(activeTabId);
      loadFile(activeTabId, tab.id, tab.path);
    }
  }, [activeTabId, openTabs, loadFile]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  useEffect(() => {
    const editorHandle = editorRef.current;
    if (!activeTabId) return;
    return () => {
      if (activeTabId) {
        saveViewState(activeTabId, editorHandle?.getEditor()?.saveViewState());
      }
    };
  }, [activeTabId, saveViewState]);

  const content = activeState?.content ?? '';

  const { currentProjectId } = useWorkspaceStore();
  const [showPreview, setShowPreview] = useState(false);

  const handleAcceptFile = useCallback(async () => {
    if (!currentProjectId || !activeTab?.path) return;
    await fetch(`/api/projects/${currentProjectId}/explorer/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: activeTab.path, action: 'accept' }),
    });
    window.dispatchEvent(new CustomEvent('explorer-refresh'));
    if (activeTabId) {
      loadedTabsRef.current.delete(activeTabId);
      loadFile(activeTabId, activeTab.id, activeTab.path);
    }
  }, [currentProjectId, activeTab, activeTabId, loadFile]);

  const handleRejectFile = useCallback(async () => {
    if (!currentProjectId || !activeTab?.path) return;
    await fetch(`/api/projects/${currentProjectId}/explorer/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: activeTab.path, action: 'reject' }),
    });
    window.dispatchEvent(new CustomEvent('explorer-refresh'));
    window.dispatchEvent(new CustomEvent('studio-preview-reload'));
    if (activeTabId) {
      loadedTabsRef.current.delete(activeTabId);
      loadFile(activeTabId, activeTab.id, activeTab.path);
    }
  }, [currentProjectId, activeTab, activeTabId, loadFile]);

  useEffect(() => {
    function handleToggle() {
      setShowPreview((prev) => !prev);
    }
    window.addEventListener('toggle-workspace-preview', handleToggle);
    return () => window.removeEventListener('toggle-workspace-preview', handleToggle);
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <CommandPalette />

      {openTabs.length > 0 && (
        <div className="flex h-9 shrink-0 items-center overflow-x-auto border-b border-border/70 bg-muted/20">
          {openTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex h-full shrink-0 cursor-pointer items-center gap-2 border-r border-border/60 px-3 text-[12px]',
                tab.id === activeTabId
                  ? 'bg-background text-foreground shadow-[inset_0_-2px_0_0_var(--primary)]'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              <span>{tab.title}</span>
              {tab.isDirty && <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="rounded p-0.5 hover:bg-secondary"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTabId && activeState && (
        <EditorToolbar
          onSave={handleSave}
          onFormat={handleFormat}
          onUndo={handleUndo}
          onRedo={handleRedo}
          isDirty={activeState.isDirty}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview((prev) => !prev)}
          reviewStatus={activeState.reviewStatus}
          onAcceptFile={() => void handleAcceptFile()}
          onRejectFile={() => void handleRejectFile()}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full flex-col gap-3 bg-[#1e1e1e] p-6 w-full">
            <div className="flex items-center gap-2 pb-2">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-neutral-600" />
              <div className="h-3 w-48 animate-pulse rounded bg-neutral-700/50" />
            </div>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="h-3 animate-pulse rounded bg-neutral-700/50"
                style={{ width: `${30 + Math.random() * 65}%` }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden w-full">
            {activeTabId && activeState ? (
              <div className={cn('h-full flex-1 overflow-hidden', showPreview && 'w-1/2')}>
                <MonacoEditorWrapper
                  ref={editorRef}
                  filePath={openTabs.find((t) => t.id === activeTabId)?.path ?? ''}
                  value={content}
                  language={activeLanguage}
                  preferences={preferences}
                  onChange={(val) => activeTabId && handleContentChange(activeTabId, val)}
                  onCursorChange={(line, col) => activeTabId && updateCursorPosition(activeTabId, line, col)}
                  onSave={handleSave}
                />
              </div>
            ) : !showPreview ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_top,_rgba(36,95,115,0.08),_transparent_55%)] p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="max-w-sm text-center">
                  <p className="font-heading text-lg font-semibold tracking-tight text-foreground">
                    Studio is ready
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Open a file from Explorer on the left, or keep Preview open on the right to
                    run the generated app.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      useWorkspaceStore.getState().enterStudioFocus({ activity: 'explorer' });
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-primary/30"
                  >
                    Focus Explorer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      useWorkspaceStore.getState().setPreviewSplit(true);
                      setShowPreview(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                  >
                    ▶ Show Preview
                  </button>
                </div>
              </div>
            ) : null}

            {showPreview && currentProjectId && (
              <div className={cn('h-full border-l border-border overflow-hidden bg-background', activeTabId ? 'w-1/2' : 'w-full')}>
                <LivePreview
                  projectId={currentProjectId}
                  code={content}
                  filePath={openTabs.find((t) => t.id === activeTabId)?.path}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {activeTabId && activeState && (
        <div className="flex h-7 shrink-0 items-center justify-between border-t bg-card px-3">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <LanguageSelector
              currentLanguage={activeLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>
              Ln {activeState.cursorPosition.line}, Col {activeState.cursorPosition.column}
            </span>
            <span>{activeLanguage}</span>
            <span>UTF-8</span>
            <span>Spaces: {preferences.tabSize}</span>
          </div>
        </div>
      )}
    </div>
  );
}
