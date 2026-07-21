'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, Edit3, Clock } from 'lucide-react';
import type { DocPage } from '../types';
import type { UpdateDocumentInput } from '../schemas/documentation.schema';

interface DocEditorProps {
  document: DocPage;
  onUpdate: (input: UpdateDocumentInput) => void;
  onRevert?: (versionId: string) => void;
  isSaving?: boolean;
}

function DocEditorInner({ document, onUpdate, isSaving }: DocEditorProps) {
  const [content, setContent] = useState(document.content);
  const [title, setTitle] = useState(document.title);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [isDirty, setIsDirty] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(
    (newContent: string, newTitle: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onUpdate({ content: newContent, title: newTitle });
        setIsDirty(false);
      }, 1000);
    },
    [onUpdate],
  );

  const handleContentChange = (value: string) => {
    setContent(value);
    setIsDirty(true);
    debouncedSave(value, title);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setIsDirty(true);
    debouncedSave(content, value);
  };

  const handleSave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onUpdate({ content, title });
    setIsDirty(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="placeholder:text-muted-foreground min-w-0 flex-1 border-none bg-transparent text-sm font-medium outline-none"
            placeholder="Document title..."
          />
          <Badge variant="secondary" className="shrink-0">
            v{document.version}
          </Badge>
          {isDirty && (
            <Badge variant="outline" className="shrink-0 border-orange-300 text-orange-600">
              Unsaved
            </Badge>
          )}
        </div>
        <div className="ml-3 flex items-center gap-1">
          <Button
            variant={viewMode === 'edit' ? 'default' : 'ghost'}
            size="icon-xs"
            onClick={() => setViewMode('edit')}
            title="Edit mode"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button
            variant={viewMode === 'split' ? 'default' : 'ghost'}
            size="icon-xs"
            onClick={() => setViewMode('split')}
            title="Split view"
          >
            <span className="flex gap-px">
              <span className="h-3 w-1.5 rounded-sm border border-current" />
              <span className="h-3 w-1.5 rounded-sm border border-current" />
            </span>
          </Button>
          <Button
            variant={viewMode === 'preview' ? 'default' : 'ghost'}
            size="icon-xs"
            onClick={() => setViewMode('preview')}
            title="Preview mode"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <div className="bg-border mx-1 h-4 w-px" />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            title="Save"
          >
            <Save className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`${viewMode === 'split' ? 'w-1/2 border-r' : 'w-full'} flex min-h-0 flex-col`}
          >
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed outline-none"
              placeholder="Write your documentation in Markdown..."
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex min-h-0 flex-col`}>
            <div className="flex-1 overflow-auto p-4">
              <MarkdownPreview content={content} />
            </div>
          </div>
        )}
      </div>

      <div className="text-muted-foreground flex items-center justify-between border-t px-4 py-1.5 text-xs">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          <span>Updated {new Date(document.updatedAt).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>{document.author}</span>
          <span>&middot;</span>
          <span>{content.length} chars</span>
        </div>
      </div>
    </div>
  );
}

export function DocEditor(props: DocEditorProps) {
  return <DocEditorInner key={props.document.id} {...props} />;
}

function MarkdownPreview({ content }: { content: string }) {
  const [MarkdownComponent, setMarkdownComponent] = useState<React.ComponentType<{
    children: string;
  }> | null>(null);

  useEffect(() => {
    Promise.all([import('react-markdown'), import('remark-gfm')]).then(
      ([{ default: ReactMarkdown }, { default: remarkGfm }]) => {
        const Wrapped = ({ children }: { children: string }) => (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
        );
        setMarkdownComponent(() => Wrapped);
      },
    );
  }, []);

  if (!MarkdownComponent) {
    return <div className="text-muted-foreground text-sm italic">Loading preview...</div>;
  }

  if (!content) {
    return <div className="text-muted-foreground text-sm italic">Nothing to preview</div>;
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <MarkdownComponent>{content}</MarkdownComponent>
    </div>
  );
}
