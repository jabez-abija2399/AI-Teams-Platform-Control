'use client';

import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { editor as MonacoEditorTypes } from 'monaco-editor';
import type { EditorPreferences } from '../types';
import { detectLanguage } from '../utils/language-detector';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { ssr: false },
);

interface MonacoEditorWrapperProps {
  filePath: string;
  value: string;
  language: string;
  preferences: EditorPreferences;
  onChange?: (value: string | undefined) => void;
  onCursorChange?: (line: number, column: number) => void;
  onSave?: () => void;
  onViewStateChange?: (viewState: unknown) => void;
}

export interface MonacoEditorHandle {
  getModel: () => MonacoEditorTypes.ITextModel | null;
  getEditor: () => MonacoEditorTypes.IStandaloneCodeEditor | null;
  focus: () => void;
}

function EditorSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
        <span className="text-xs text-neutral-500">Loading editor…</span>
      </div>
    </div>
  );
}

export const MonacoEditorWrapper = forwardRef<MonacoEditorHandle, MonacoEditorWrapperProps>(
  function MonacoEditorWrapper(
    {
      filePath,
      value,
      language,
      preferences,
      onChange,
      onCursorChange,
      onSave,
      onViewStateChange: _onViewStateChange,
    },
    ref,
  ) {
    const editorRef = useRef<MonacoEditorTypes.IStandaloneCodeEditor | null>(null);

    useImperativeHandle(ref, () => ({
      getModel: () => editorRef.current?.getModel() ?? null,
      getEditor: () => editorRef.current,
      focus: () => editorRef.current?.focus(),
    }));

    const detectedLanguage = language || detectLanguage(filePath);

    const handleMount = useCallback(
      (
        editor: MonacoEditorTypes.IStandaloneCodeEditor,
        monaco: { editor: { defineTheme: (name: string, theme: MonacoEditorTypes.IStandaloneThemeData) => void } },
      ) => {
        editorRef.current = editor;

        monaco.editor.defineTheme('custom-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#0a0a0a',
            'editor.foreground': '#d4d4d4',
            'editor.lineHighlightBackground': '#ffffff08',
            'editor.selectionBackground': '#264f7860',
            'editorCursor.foreground': '#d4d4d4',
          },
        });

        editor.onDidChangeCursorPosition((e) => {
          onCursorChange?.(e.position.lineNumber, e.position.column);
        });

        editor.addAction({
          id: 'editor-save',
          label: 'Save',
          keybindings: [2048 | 49],
          run: () => onSave?.(),
        });
      },
      [onCursorChange, onSave],
    );

    const handleChange = useCallback(
      (val: string | undefined) => {
        onChange?.(val);
      },
      [onChange],
    );

    return (
      <div className="h-full w-full overflow-hidden">
        <MonacoEditor
          height="100%"
          language={detectedLanguage}
          value={value}
          theme={preferences.theme === 'vs-dark' ? 'custom-dark' : preferences.theme}
          onChange={handleChange}
          onMount={handleMount}
          loading={<EditorSkeleton />}
          options={{
            fontSize: preferences.fontSize,
            minimap: { enabled: preferences.minimap },
            wordWrap: preferences.wordWrap,
            lineNumbers: preferences.lineNumbers ? 'on' : 'off',
            tabSize: preferences.tabSize,
            padding: { top: 8 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'all',
            bracketPairColorization: { enabled: true },
            automaticLayout: true,
            suggest: {
              showMethods: true,
              showFunctions: true,
              showConstructors: true,
              showFields: true,
              showVariables: true,
              showClasses: true,
              showStructs: true,
              showInterfaces: true,
              showModules: true,
              showProperties: true,
              showEvents: true,
              showOperators: true,
              showUnits: true,
              showValues: true,
              showConstants: true,
              showEnums: true,
              showEnumMembers: true,
              showKeywords: true,
              showWords: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
              showSnippets: true,
            },
          }}
        />
      </div>
    );
  },
);
