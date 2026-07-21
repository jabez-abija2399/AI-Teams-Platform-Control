'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import { EmptyState } from '@/components/ui/empty-state';
import { MonacoEditorWrapper } from './monaco-editor';
import type { MonacoEditorHandle } from './monaco-editor';
import { EditorToolbar } from './editor-toolbar';
import { LanguageSelector } from './language-selector';
import { CommandPalette } from './command-palette';
import { useEditor } from '../hooks/use-editor';
import { useCommandPaletteActions } from '../hooks/use-command-palette-actions';
import { detectLanguage } from '../utils/language-detector';

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

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <CommandPalette />

      {openTabs.length > 0 && (
        <div className="flex h-9 shrink-0 items-center overflow-x-auto border-b bg-card">
          {openTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex h-full shrink-0 cursor-pointer items-center gap-2 border-r px-3 text-xs',
                tab.id === activeTabId
                  ? 'bg-background text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/40',
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
        />
      )}

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading file…
          </div>
        ) : activeTabId && activeState ? (
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
        ) : (
          <EmptyState
            icon={FileText}
            title="No file open"
            description="Select a file from the explorer to start editing."
            className="h-full border-0"
          />
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
