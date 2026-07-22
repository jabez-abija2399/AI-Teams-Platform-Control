'use client';

import { EditorContainer } from '@/features/editor';

export function EditorArea() {
  return (
    <div data-tour="editor" className="flex-1 overflow-hidden">
      <EditorContainer />
    </div>
  );
}
