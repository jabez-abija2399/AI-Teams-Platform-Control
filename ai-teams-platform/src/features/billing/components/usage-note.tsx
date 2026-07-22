import { Coins } from 'lucide-react';

export function UsageNote({ tokens }: { tokens: number }) {
  if (tokens === 0) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <Coins className="h-3 w-3" /> This used ~{tokens.toLocaleString()} tokens
    </p>
  );
}
