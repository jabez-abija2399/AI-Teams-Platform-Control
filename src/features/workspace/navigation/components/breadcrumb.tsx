import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export function Breadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {seg.href ? (
            <Link href={seg.href} className="hover:text-foreground">
              {seg.label}
            </Link>
          ) : (
            <span className="text-foreground">{seg.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
