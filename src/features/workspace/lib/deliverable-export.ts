'use client';

import {
  formatDocValue,
  documentToSections,
  type ReadableDocument,
} from '../components/document-reader';

export function documentToMarkdown(doc: ReadableDocument): string {
  const sections = documentToSections(doc.content, true);
  const lines = [
    `# ${doc.title}`,
    '',
    doc.producedBy ? `*Prepared by ${doc.producedBy}*` : '',
    doc.summary ? `\n${doc.summary}\n` : '',
    ...sections.flatMap((s: { label: string; body: string }) => [
      `## ${s.label}`,
      '',
      s.body,
      '',
    ]),
  ].filter(Boolean);
  return lines.join('\n');
}

export function downloadMarkdown(doc: ReadableDocument): void {
  const md = documentToMarkdown(doc);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.title.replace(/[^\w\-]+/g, '_').slice(0, 60) || 'deliverable'}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Print-friendly HTML → browser “Save as PDF”. */
export function exportDeliverablePdf(doc: ReadableDocument): void {
  const sections = documentToSections(doc.content, true);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(doc.title)}</title>
<style>
  body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;color:#1a3339;line-height:1.55}
  h1{font-size:28px;margin:0 0 8px}
  .meta{color:#4a5f66;font-size:13px;margin-bottom:28px}
  h2{font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#245F73;margin:28px 0 8px}
  p{white-space:pre-wrap;font-size:14px;margin:0}
</style></head><body>
<h1>${escapeHtml(doc.title)}</h1>
<div class="meta">${escapeHtml(doc.producedBy || 'AI Company')}${doc.summary ? ' · ' + escapeHtml(doc.summary) : ''}</div>
${sections
  .map(
    (s: { label: string; body: string }) =>
      `<h2>${escapeHtml(s.label)}</h2><p>${escapeHtml(s.body)}</p>`,
  )
  .join('')}
<script>window.onload=()=>window.print()</script>
</body></html>`;
  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function contentPreview(content: unknown, max = 160): string {
  const text = typeof content === 'string' ? content : formatDocValue(content);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
