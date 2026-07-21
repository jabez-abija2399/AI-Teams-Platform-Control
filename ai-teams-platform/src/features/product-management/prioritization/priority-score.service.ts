export interface PriorityFactors {
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
}

export interface PriorityScore {
  score: number;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  grade: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function computeGrade(score: number): string {
  if (score >= 30) return 'P0';
  if (score >= 20) return 'P1';
  if (score >= 10) return 'P2';
  if (score >= 5) return 'P3';
  return 'P4';
}

export function calculatePriorityScore(factors: PriorityFactors): PriorityScore {
  const reach = clamp(factors.reach, 0, 1000000);
  const impact = clamp(factors.impact, 0, 5);
  const confidence = clamp(factors.confidence, 0, 100);
  const effort = Math.max(factors.effort, 0.1);

  const raw = (reach * impact * (confidence / 100)) / effort;
  const score = Math.round(raw * 100) / 100;
  const grade = computeGrade(score);

  return { score, reach, impact, confidence, effort, grade };
}
