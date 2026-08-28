/**
 * Lightweight quality scoring for agent deliverables (heuristic + LLM outputs).
 * Bar: would a demanding hiring manager accept this from a senior employee?
 */

export type ExcellenceVerdict = 'APPROVED' | 'NEEDS_REVISION' | 'REJECTED';

export interface ExcellenceScore {
  completeness: number;
  clarity: number;
  fidelity: number;
  overall: number;
  verdict: ExcellenceVerdict;
  notes: string[];
}

function clamp(n: number): number {
  return Math.max(1, Math.min(10, Math.round(n)));
}

export function scoreAgentDeliverable(input: {
  role: string;
  /** Serialized deliverable */
  payload: unknown;
  /** User / stack constraints blob */
  constraints?: string;
  /** Required substrings or path hints */
  mustInclude?: string[];
  /** Forbidden substrings (e.g. next.js when static) */
  mustExclude?: string[];
}): ExcellenceScore {
  const text = JSON.stringify(input.payload ?? {}).toLowerCase();
  const notes: string[] = [];
  let completeness = 8;
  let clarity = 8;
  let fidelity = 9;

  const constraints = (input.constraints || '').toLowerCase();
  const staticAsk =
    (constraints.includes('html') && constraints.includes('css')) ||
    constraints.includes('no backend') ||
    constraints.includes('no bakcned') ||
    constraints.includes('static');

  if (input.mustInclude?.length) {
    for (const req of input.mustInclude) {
      if (!text.includes(req.toLowerCase())) {
        completeness -= 2;
        fidelity -= 2;
        notes.push(`Missing required signal: ${req}`);
      }
    }
  }

  if (input.mustExclude?.length) {
    for (const bad of input.mustExclude) {
      if (text.includes(bad.toLowerCase())) {
        fidelity -= 3;
        notes.push(`Forbidden content present: ${bad}`);
      }
    }
  }

  if (staticAsk) {
    if (text.includes('next.js') || text.includes('"next"') || text.includes('.tsx')) {
      fidelity -= 4;
      notes.push('Static/HTML request but Next/React artifacts detected');
    }
    if (
      (text.includes('express') || text.includes('postgres') || text.includes('prisma')) &&
      !text.includes('none')
    ) {
      fidelity -= 2;
      notes.push('Backend/DB invented despite static constraints');
    }
  }

  // Vague filler penalty
  const vagueHits = (text.match(/improve user experience|scalable architecture|best practices/g) || [])
    .length;
  if (vagueHits >= 2) {
    clarity -= 2;
    notes.push('Too much vague filler — be concrete');
  }

  // Thin payload
  if (text.length < 80) {
    completeness -= 3;
    notes.push('Deliverable too thin for a senior hire');
  }

  completeness = clamp(completeness);
  clarity = clamp(clarity);
  fidelity = clamp(fidelity);
  const overall = clamp((completeness + clarity + fidelity) / 3);

  const verdict: ExcellenceVerdict =
    overall >= 8 ? 'APPROVED' : overall >= 5 ? 'NEEDS_REVISION' : 'REJECTED';

  if (notes.length === 0) {
    notes.push(`Meets world-class bar for ${input.role}`);
  }

  return { completeness, clarity, fidelity, overall, verdict, notes };
}
