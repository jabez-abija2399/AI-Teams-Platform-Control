export interface ResponsiveIssue {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
}

export interface ResponsiveResult {
  score: number;
  issues: ResponsiveIssue[];
  passed: number;
  failed: number;
  total: number;
}

const PIXEL_WIDTH_REGEX = /(?:width|min-width|max-width)\s*:\s*(\d+)px/g;
const TAILWIND_FIXED_REGEX = /\b(?:w|min-w|max-w)-(\d+)\b/g;
const TAILWIND_SM_PREFIX = /@media.*min-width|sm:|md:|lg:|xl:/;

function findIssues(code: string): ResponsiveIssue[] {
  const issues: ResponsiveIssue[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    const stylePixelMatches = [...line.matchAll(PIXEL_WIDTH_REGEX)];
    for (const match of stylePixelMatches) {
      const pixelValue = parseInt(match[1] ?? '0', 10);
      if (pixelValue > 320 && !line.includes('@media')) {
        issues.push({
          rule: 'no-fixed-width',
          severity: 'warning',
          message: `Fixed ${match[0]} (${pixelValue}px) without a responsive breakpoint. Consider using max-width or a responsive utility.`,
          line: i + 1,
        });
      }
    }

    const tailwindFixedMatches = [...line.matchAll(TAILWIND_FIXED_REGEX)];
    for (const match of tailwindFixedMatches) {
      const pixels = parseInt(match[1] ?? '0', 10);
      if (pixels > 320) {
        const hasResponsivePrefix = TAILWIND_SM_PREFIX.test(line);
        if (!hasResponsivePrefix && !line.includes('min-w-') && !line.includes('max-w-')) {
          issues.push({
            rule: 'no-fixed-width',
            severity: 'warning',
            message: `Tailwind class ${match[0]} sets a fixed width of ${pixels}px without a responsive prefix (sm:, md:, lg:).`,
            line: i + 1,
          });
        }
      }
    }
  }

  return issues;
}

export function analyzeResponsiveness(componentCode: string): ResponsiveResult {
  const issues = findIssues(componentCode);
  const passed = issues.length === 0 ? 1 : 0;
  const total = 1;
  const failed = issues.length > 0 ? 1 : 0;
  const score = failed === 0 ? 100 : Math.max(0, 100 - issues.length * 15);

  return { score, issues, passed, failed, total };
}
