export type MemoryImportance = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const HIGH_IMPORTANCE_PATTERNS = [/decided/i, /architecture/i, /security/i, /requirement/i, /breaking change/i];
const LOW_IMPORTANCE_PATTERNS = [/debug/i, /test run/i, /just checking/i];

export function calculateImportance(content: string): MemoryImportance {
  if (HIGH_IMPORTANCE_PATTERNS.some((p) => p.test(content))) return 'HIGH';
  if (LOW_IMPORTANCE_PATTERNS.some((p) => p.test(content))) return 'LOW';
  return 'MEDIUM';
}

export function classifyMemoryType(content: string): 'TECHNICAL' | 'DECISION' | 'USER_PREFERENCE' | 'GENERAL' {
  if (/decided|chose|selected/i.test(content)) return 'DECISION';
  if (/prefer|like|want/i.test(content)) return 'USER_PREFERENCE';
  if (/database|api|component|function|schema/i.test(content)) return 'TECHNICAL';
  return 'GENERAL';
}

export function importanceWeight(importance: string): number {
  return { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[importance] ?? 2;
}
