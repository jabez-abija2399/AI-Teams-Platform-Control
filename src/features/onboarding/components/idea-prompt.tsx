'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EXAMPLE_IDEAS } from '../constants/examples.constants';

export function IdeaPrompt({ onSubmit }: { onSubmit: (idea: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <div className="mx-auto max-w-2xl space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">What do you want to build?</h1>
        <p className="text-muted-foreground">Describe it in a sentence. Your AI team takes it from there.</p>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && value.trim().length >= 10) {
              e.preventDefault();
              onSubmit(value);
            }
          }}
          placeholder="e.g. A tool that helps freelancers track invoices and get paid faster…"
          rows={3}
          autoFocus
          className="w-full resize-none rounded-xl border bg-background p-4 text-base outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          size="icon"
          className="absolute bottom-3 right-3 h-9 w-9 rounded-full"
          disabled={value.trim().length < 10}
          onClick={() => onSubmit(value)}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">Or try:</span>
        {EXAMPLE_IDEAS.map((ex) => (
          <button
            key={ex.title}
            onClick={() => onSubmit(ex.prompt)}
            className="rounded-full border px-3 py-1.5 text-xs hover:bg-secondary"
          >
            {ex.emoji} {ex.title}
          </button>
        ))}
      </div>
    </div>
  );
}
