'use client';

import { cn } from '@/lib/utils';

export interface ReadableDocument {
  title: string;
  type: string;
  summary?: string;
  producedBy?: string;
  content: unknown;
}

export function formatDocValue(value: unknown, depth = 0): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
      return value.map(String).join(', ');
    }
    return value
      .slice(0, depth === 0 ? 20 : 8)
      .map((item, i) => {
        if (typeof item === 'object' && item && 'name' in item) {
          const row = item as { name: string; priority?: string; description?: string };
          return `${i + 1}. ${row.name}${row.priority ? ` (${row.priority})` : ''}${
            row.description ? `\n   ${row.description}` : ''
          }`;
        }
        return `${i + 1}. ${formatDocValue(item, depth + 1)}`;
      })
      .join('\n');
  }
  if (typeof value === 'object') {
    if (depth > 2) return JSON.stringify(value, null, 2);
    return Object.entries(value as Record<string, unknown>)
      .slice(0, depth === 0 ? 24 : 12)
      .map(([k, v]) => `${k}: ${formatDocValue(v, depth + 1)}`)
      .join('\n');
  }
  return String(value);
}

export function documentToSections(
  content: unknown,
  large = false,
): { label: string; body: string }[] {
  if (content == null) return [{ label: 'Document', body: 'No content available yet.' }];
  if (typeof content === 'string') return [{ label: 'Content', body: content }];
  if (typeof content !== 'object') return [{ label: 'Content', body: String(content) }];

  const obj = content as Record<string, unknown>;
  const preferred = [
    'productName',
    'tagline',
    'vision',
    'problem',
    'problemStatement',
    'targetAudience',
    'platform',
    'complexity',
    'mvpFeatures',
    'features',
    'futureFeatures',
    'estimatedTimeline',
    'risks',
    'architecture',
    'techStack',
    'database',
    'api',
    'apiDesign',
    'decisions',
    'pages',
    'components',
    'layoutMockups',
    'visualStyleGuide',
    'milestones',
    'findings',
    'recommendations',
    'questions',
    'revisionNote',
  ];

  const sections: { label: string; body: string }[] = [];
  const used = new Set<string>();
  const maxSections = large ? 40 : 12;
  const skipKeys = new Set(['aiTeam', 'id', 'Id']);

  for (const key of preferred) {
    if (obj[key] !== undefined) {
      used.add(key);
      sections.push({
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
        body: formatDocValue(obj[key]),
      });
    }
  }

  for (const [key, value] of Object.entries(obj)) {
    if (used.has(key) || skipKeys.has(key)) continue;
    if (value == null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (
      !large &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value as object).length > 15
    ) {
      continue;
    }
    sections.push({
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
      body: formatDocValue(value),
    });
    if (sections.length >= maxSections) break;
  }

  return sections.length ? sections : [{ label: 'Document', body: JSON.stringify(content, null, 2) }];
}

export function DocumentBody({
  document,
  sections,
  large,
}: {
  document: ReadableDocument | null;
  sections: { label: string; body: string }[];
  large?: boolean;
}) {
  return (
    <div className={cn('space-y-5', large ? 'space-y-7' : 'space-y-3')}>
      {document?.summary && (
        <p
          className={cn(
            'leading-relaxed text-muted-foreground',
            large ? 'text-base' : 'text-xs',
          )}
        >
          {document.summary}
        </p>
      )}
      {sections.map((section) => (
        <section key={section.label}>
          <h3
            className={cn(
              'font-semibold uppercase tracking-wider text-muted-foreground',
              large ? 'text-xs' : 'text-[11px]',
            )}
          >
            {section.label}
          </h3>
          <p
            className={cn(
              'mt-2 whitespace-pre-wrap leading-relaxed text-foreground',
              large ? 'text-base' : 'text-sm',
            )}
          >
            {section.body}
          </p>
        </section>
      ))}
      {!document && (
        <p className="text-sm text-muted-foreground">No document content available.</p>
      )}
    </div>
  );
}
