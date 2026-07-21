'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CommentItem {
  id: string;
  authorId: string;
  authorType: string;
  content: string;
  createdAt: string | Date;
}

interface CommentThreadProps {
  comments: CommentItem[];
  onAdd: (content: string) => void;
}

export function CommentThread({ comments, onAdd }: CommentThreadProps) {
  const [value, setValue] = useState('');

  return (
    <div className="space-y-3">
      {comments.length === 0 && (
        <p className="text-muted-foreground py-4 text-center text-sm">No comments yet.</p>
      )}
      {comments.map((c) => (
        <div key={c.id} className="rounded-md border p-2.5 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium">{c.authorType === 'AI_AGENT' ? 'AI' : 'You'}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(c.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p>{c.content}</p>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a comment... use @ to mention"
          className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) {
              onAdd(value);
              setValue('');
            }
          }}
        />
        <Button
          size="sm"
          onClick={() => { onAdd(value); setValue(''); }}
          disabled={!value.trim()}
        >
          Post
        </Button>
      </div>
    </div>
  );
}
