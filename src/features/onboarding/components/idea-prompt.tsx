'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SampleGallery } from './sample-gallery';

interface Sample {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  featured: boolean;
}

export function IdeaPrompt({ onSubmit }: { onSubmit: (idea: string, fromSample?: boolean) => void }) {
  const [value, setValue] = useState('');
  const [samples, setSamples] = useState<Sample[]>([]);

  useEffect(() => {
    fetch('/api/samples')
      .then((r) => r.json())
      .then((res) => res.success && setSamples(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 text-center sm:px-0">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">What do you want to build?</h1>
        <p className="text-muted-foreground">
          Describe it in a sentence. Your AI team takes it from there.
        </p>
      </div>

      <div className="relative mx-auto max-w-2xl">
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

      {samples.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Or start from an example</p>
          <SampleGallery samples={samples} onSelect={(prompt) => onSubmit(prompt, true)} />
        </div>
      )}
    </div>
  );
}
