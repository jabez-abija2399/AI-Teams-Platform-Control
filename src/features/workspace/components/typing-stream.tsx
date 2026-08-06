'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Cursor / ChatGPT-style streaming typewriter for the live agent message.
 */
export function TypingStream({
  text,
  className,
  speedMs = 18,
}: {
  text: string;
  className?: string;
  speedMs?: number;
}) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown('');
    setDone(false);
    if (!text) return;

    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        setDone(true);
      }
    }, speedMs);

    return () => window.clearInterval(id);
  }, [text, speedMs]);

  return (
    <p className={cn('leading-relaxed', className)}>
      {shown}
      {!done && (
        <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] animate-soft-pulse bg-primary" />
      )}
    </p>
  );
}
