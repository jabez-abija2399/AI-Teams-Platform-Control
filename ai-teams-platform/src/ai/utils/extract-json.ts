function cleanJsonString(s: string): string {
  return s
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
    .replace(/[\x00-\x1f]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

function tryParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return JSON.parse(cleanJsonString(s));
  }
}

function extractBounded(text: string, open: string, close: string): string | null {
  const first = text.indexOf(open);
  const last = text.lastIndexOf(close);
  if (first !== -1 && last > first) {
    return text.slice(first, last + 1);
  }
  return null;
}

function tryAutoFix(s: string): string {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let result = '';
  for (const ch of s) {
    if (escaped) { escaped = false; result += ch; continue; }
    if (inString) {
      if (ch === '\\') { escaped = true; result += ch; continue; }
      if (ch === '"') { inString = false; result += ch; continue; }
      if (ch === '\n' || ch === '\r') { result += '\\n'; continue; }
      result += ch;
      continue;
    }
    if (ch === '"') { inString = true; result += ch; continue; }
    if (ch === '{' || ch === '[') { depth++; result += ch; continue; }
    if (ch === '}' || ch === ']') { depth--; result += ch; continue; }
    result += ch;
  }
  if (inString) result += '"';
  while (depth > 0) { result += '}'; depth--; }
  return result;
}

export function extractJson(text: string): unknown {
  let cleaned = text.trim();
  try { require('fs').writeFileSync('/tmp/extract-json-input.log', `[${new Date().toISOString()}] INPUT (${text.length} chars):\n${text.slice(0, 3000)}\n\n---\n\n`, { flag: 'a' }); } catch {}

  const codeBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/);
  if (codeBlock?.[1]?.trim()) {
    try {
      const result = tryParse(codeBlock[1].trim());
      try { require('fs').writeFileSync('/tmp/extract-json-input.log', `  -> CODEBLOCK SUCCESS\n`, { flag: 'a' }); } catch {}
      return result;
    } catch { /* fall through */ }
  }

  cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();

  for (const pair of [['{', '}'], ['[', ']']] as const) {
    const bounded = extractBounded(cleaned, pair[0], pair[1]);
    if (bounded) {
      try {
        const result = tryParse(bounded);
        try { require('fs').writeFileSync('/tmp/extract-json-input.log', `  -> BRACKET SUCCESS (${pair[0]}): ${bounded.slice(0, 100)}\n`, { flag: 'a' }); } catch {}
        return result;
      } catch {
        try {
          const fixed = tryAutoFix(bounded);
          const result = tryParse(fixed);
          try { require('fs').writeFileSync('/tmp/extract-json-input.log', `  -> BRACKET AUTOFIX SUCCESS: ${fixed.slice(0, 100)}\n`, { flag: 'a' }); } catch {}
          return result;
        } catch { /* fall through */ }
      }
    }
  }

  const final = tryAutoFix(cleaned);
  try { require('fs').writeFileSync('/tmp/extract-json-input.log', `  -> FALLBACK AUTOFIX: ${final.slice(0, 200)}\n`, { flag: 'a' }); } catch {}
  return tryParse(final);
}
