'use client';

import { Save, Undo2, Redo2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorToolbarProps {
  onSave: () => void;
  onFormat?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  isDirty: boolean;
}

export function EditorToolbar({
  onSave,
  onFormat,
  onUndo,
  onRedo,
  isDirty,
}: EditorToolbarProps) {
  return (
    <div className="flex h-8 shrink-0 items-center gap-0.5 border-b px-2">
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
  );
}
