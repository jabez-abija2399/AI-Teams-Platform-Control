'use client';

import { Save, Undo2, Redo2, Wand2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorToolbarProps {
  onSave: () => void;
  onFormat?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  isDirty: boolean;
  showPreview?: boolean;
  onTogglePreview?: () => void;
}

export function EditorToolbar({
  onSave,
  onFormat,
  onUndo,
  onRedo,
  isDirty,
  showPreview,
  onTogglePreview,
}: EditorToolbarProps) {
  return (
    <div className="flex h-8 shrink-0 items-center justify-between border-b px-2">
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          disabled={!isDirty}
          className="h-6 w-6 p-0"
          title="Save (Ctrl+S)"
        >
          <Save className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          className="h-6 w-6 p-0"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          className="h-6 w-6 p-0"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        <div className="bg-border mx-1 h-4 w-px" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onFormat}
          className="h-6 w-6 p-0"
          title="Format Document"
        >
          <Wand2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {onTogglePreview && (
        <button
          onClick={onTogglePreview}
          className={`h-6 px-3 text-xs font-semibold rounded flex items-center gap-1.5 transition-all shadow-sm ${
            showPreview
              ? 'bg-sky-600 text-white shadow-sky-950/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
          }`}
          title="Toggle Split-Screen Live Preview & Run App"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>{showPreview ? 'Hide Preview' : '▶ Run App & Preview'}</span>
        </button>
      )}
    </div>
  );
}
