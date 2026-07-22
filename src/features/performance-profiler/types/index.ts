export interface PerformanceScore {
  overall: number;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export interface BundleAnalysis {
  totalSize: number;
  jsSize: number;
  cssSize: number;
  imageSize: number;
  packages: PackageInfo[];
}

export interface PackageInfo {
  name: string;
  version: string;
  size: number;
  gzipSize: number;
}

export interface PerformanceIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  recommendation: string;
  impact: string;
}

export interface PerformanceReport {
  id: string;
  projectId: string;
  score: PerformanceScore;
  bundle: BundleAnalysis;
  issues: PerformanceIssue[];
  recommendations: string[];
  createdAt: Date;
}
