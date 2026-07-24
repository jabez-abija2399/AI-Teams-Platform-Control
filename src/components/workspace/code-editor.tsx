'use client';

import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  activeFilePath: string | null;
  fileContent: string;
  onCodeChange: (newCode: string) => void;
}

function detectLanguage(filePath: string | null): string {
  if (!filePath) return 'typescript';
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'ts':
      return 'typescript';
    case 'jsx':
    case 'js':
    case 'mjs':
      return 'javascript';
    case 'json':
      return 'json';
    case 'css':
    case 'scss':
      return 'css';
    case 'html':
      return 'html';
    case 'py':
      return 'python';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'java':
      return 'java';
    case 'cpp':
    case 'c':
    case 'h':
      return 'cpp';
    case 'md':
      return 'markdown';
    default:
      return 'typescript';
  }
}

export function CodeEditor({ activeFilePath, fileContent, onCodeChange }: CodeEditorProps) {
  if (!activeFilePath) {
    return (
      <div className="h-full w-full bg-slate-900 flex items-center justify-center text-slate-500 text-sm">
        Select a file from the explorer to view or edit code.
      </div>
    );
  }

  const language = detectLanguage(activeFilePath);

  return (
    <div className="h-full w-full flex flex-col bg-slate-900">
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono text-sky-400">{activeFilePath}</span>
        <span className="uppercase text-[10px] tracking-widest font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
          {language}
        </span>
      </div>
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          value={fileContent}
          onChange={(value) => onCodeChange(value || '')}
          theme="vs-dark"
          options={{
            fontSize: 13,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            padding: { top: 12 },
            lineNumbers: 'on',
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
