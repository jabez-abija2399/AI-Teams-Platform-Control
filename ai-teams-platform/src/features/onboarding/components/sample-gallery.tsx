'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Sample {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  featured: boolean;
}

export function SampleGallery({ samples, onSelect }: { samples: Sample[]; onSelect: (prompt: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {samples.map((s) => (
        <Card
          key={s.id}
          className="cursor-pointer transition-colors hover:border-foreground/20"
          onClick={() => onSelect(s.prompt)}
        >
          <CardContent className="p-3">
            {s.featured && (
              <Badge variant="secondary" className="mb-1.5 text-[10px]">
                Popular
              </Badge>
            )}
            <p className="text-xs font-medium">{s.title}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{s.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
