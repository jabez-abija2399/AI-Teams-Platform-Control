'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorState, EditorPreferences } from '../types';
import type { FileContent } from '../types';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';

const AUTOSAVE_DELAY_MS = 2000;

const DEFAULT_PREFERENCES: EditorPreferences = {
  fontSize: 14,
  minimap: true,
  wordWrap: 'off',
  lineNumbers: true,
  tabSize: 2,
  theme: 'vs-dark',
};

const STORAGE_KEY = 'editor-preferences';

function loadLocalPreferences(): EditorPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function saveLocalPreferences(prefs: EditorPreferences): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function useEditor() {
  const { activeTabId, markTabDirty } = useWorkspaceStore();

  const [editorStates, setEditorStates] = useState<Map<string, EditorState>>(new Map());
  const [preferences, setPreferences] = useState<EditorPreferences>(loadLocalPreferences);
  const [isLoading, setIsLoading] = useState(false);

  const autosaveTimerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const contentRef = useRef<Map<string, string>>(new Map());
  const triggerAutosaveRef = useRef<(tabId: string) => Promise<void>>(async () => {});

  const activeState = activeTabId ? editorStates.get(activeTabId) ?? null : null;

  const updateEditorState = useCallback(
    (tabId: string, updates: Partial<EditorState>) => {
      setEditorStates((prev) => {
        const next = new Map(prev);
        const existing = next.get(tabId);
        if (existing) {
          next.set(tabId, { ...existing, ...updates });
        }
        return next;
      });
    },
    [],
  );

  const loadFile = useCallback(
    async (tabId: string, fileId: string, _filePath: string): Promise<FileContent | null> => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/editor/file/${fileId}`);
        const json = await res.json();
        if (!json.success) return null;

        const data: FileContent = json.data;
        contentRef.current.set(tabId, data.content);

        const newState: EditorState = {
          fileId: data.fileId,
          content: data.content,
          language: data.language,
          isDirty: false,
          cursorPosition: { line: 1, column: 1 },
          viewState: null,
          decorations: [],
        };

        setEditorStates((prev) => {
          const next = new Map(prev);
          next.set(tabId, newState);
          return next;
        });

        return data;
      } catch {
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const handleContentChange = useCallback(
    (tabId: string, value: string | undefined) => {
      if (value === undefined) return;

      contentRef.current.set(tabId, value);
      updateEditorState(tabId, { content: value, isDirty: true });
      markTabDirty(tabId, true);

      const existing = autosaveTimerRef.current.get(tabId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        triggerAutosaveRef.current(tabId);
      }, AUTOSAVE_DELAY_MS);
      autosaveTimerRef.current.set(tabId, timer);
    },
    [updateEditorState, markTabDirty],
  );

  const triggerAutosave = useCallback(
    async (tabId: string) => {
      const state = editorStates.get(tabId);
      const content = contentRef.current.get(tabId);
      if (!state || !content || !state.isDirty) return;

      try {
        const res = await fetch(`/api/editor/file/${state.fileId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        const json = await res.json();
        if (json.success) {
          updateEditorState(tabId, { isDirty: false });
          markTabDirty(tabId, false);
        }
      } catch {
        // autosave failed silently, will retry on next change
      }
    },
    [editorStates, updateEditorState, markTabDirty],
  );

  useEffect(() => {
    triggerAutosaveRef.current = triggerAutosave;
  });

  const save = useCallback(
    async (tabId?: string) => {
      const targetTabId = tabId ?? activeTabId;
      if (!targetTabId) return;

      const existing = autosaveTimerRef.current.get(targetTabId);
      if (existing) clearTimeout(existing);

      await triggerAutosave(targetTabId);
    },
    [activeTabId, triggerAutosave],
  );

  const updateCursorPosition = useCallback(
    (tabId: string, line: number, column: number) => {
      updateEditorState(tabId, { cursorPosition: { line, column } });
    },
    [updateEditorState],
  );

  const updatePreferences = useCallback(
    (updates: Partial<EditorPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...updates };
        saveLocalPreferences(next);
        return next;
      });
    },
    [],
  );

  const saveViewState = useCallback(
    (tabId: string, viewState: unknown) => {
      updateEditorState(tabId, { viewState });
    },
    [updateEditorState],
  );

  useEffect(() => {
    const timers = autosaveTimerRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return {
    activeState,
    editorStates,
    preferences,
    isLoading,
    loadFile,
    handleContentChange,
    save,
    updateCursorPosition,
    updatePreferences,
    saveViewState,
  };
}
