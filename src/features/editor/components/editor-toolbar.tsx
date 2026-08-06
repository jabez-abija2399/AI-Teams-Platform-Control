'use client';

import { Save, Undo2, Redo2, Wand2, Eye, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorToolbarProps {
  onSave: () => void;
  onFormat?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  isDirty: boolean;
  showPreview?: boolean;
  onTogglePreview?: () => void;
  reviewStatus?: 'accepted' | 'pending' | 'rejected' | null;
  onAcceptFile?: () => void;
  onRejectFile?: () => void;
}

export function EditorToolbar({
  onSave,
  onFormat,
  onUndo,
  onRedo,
  isDirty,
  showPreview,
  onTogglePreview,
  reviewStatus,
  onAcceptFile,
  onRejectFile,
}: EditorToolbarProps) {
  return (
    <div className="flex h-8 shrink-0 items-center justify-between border-b border-border/70 bg-white/60 px-2">
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
        {reviewStatus === 'pending' && (
          <>
            <div className="bg-border mx-1 h-4 w-px" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onAcceptFile}
              className="h-6 gap-1 px-2 text-[10px] font-semibold text-primary"
              title="Accept agent changes"
            >
              <Check className="h-3 w-3" />
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRejectFile}
              className="h-6 gap-1 px-2 text-[10px] font-semibold text-accent"
              title="Reject and restore previous"
            >
              <X className="h-3 w-3" />
              Reject
            </Button>
          </>
        )}
      </div>

      {onTogglePreview && (
        <button
          onClick={onTogglePreview}
          className={`flex h-6 items-center gap-1.5 rounded px-3 text-xs font-semibold shadow-sm transition-all ${
            showPreview
              ? 'bg-primary text-[var(--brand-cream)]'
              : 'bg-primary/90 text-[var(--brand-cream)] hover:bg-primary'
          }`}
          title="Toggle Live Preview"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>{showPreview ? 'Hide Preview' : 'Preview'}</span>
        </button>
      )}
    </div>
  );
}
