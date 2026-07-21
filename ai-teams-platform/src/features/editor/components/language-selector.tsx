'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGES: Array<{ id: string; label: string }> = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'tsx', label: 'TSX' },
  { id: 'jsx', label: 'JSX' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'scss', label: 'SCSS' },
  { id: 'json', label: 'JSON' },
  { id: 'yaml', label: 'YAML' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'python', label: 'Python' },
  { id: 'rust', label: 'Rust' },
  { id: 'go', label: 'Go' },
  { id: 'java', label: 'Java' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'sql', label: 'SQL' },
  { id: 'shell', label: 'Shell' },
  { id: 'dockerfile', label: 'Dockerfile' },
  { id: 'xml', label: 'XML' },
  { id: 'graphql', label: 'GraphQL' },
  { id: 'prisma', label: 'Prisma' },
  { id: 'plaintext', label: 'Plain Text' },
];

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

export function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.id === currentLanguage);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-accent flex items-center gap-1 rounded px-2 py-1 text-xs"
      >
        <span>{current?.label ?? currentLanguage}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="bg-background absolute bottom-full left-0 z-50 mb-1 max-h-60 w-44 overflow-y-auto rounded-md border shadow-lg">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => {
                  onLanguageChange(lang.id);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center px-3 py-1.5 text-left text-xs',
                  lang.id === currentLanguage
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-accent',
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
