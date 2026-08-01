export interface MetricScore {
  metric: string;
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  analysis: string;
}

export interface ArchitectureQualityReport {
  id: string;
  projectId: string;
  overallScore: number;
  overallGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: MetricScore[];
  technicalDebtDays: number;
  riskReport: {
    riskCategory: string;
    description: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  improvementSuggestions: string[];
  createdAt: string;
}
