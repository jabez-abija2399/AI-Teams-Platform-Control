export interface RegisteredComponent {
  id: string;
  name: string;
  category: 'UI' | 'LAYOUT' | 'FORM' | 'GRAPH' | 'FEED' | 'NAVIGATION';
  filePath: string;
  description: string;
  tags: string[];
  version: number;
}

export interface ComponentSearchDecision {
  shouldReuse: boolean;
  matchedComponent?: RegisteredComponent;
  similarityScore: number;
  recommendationReason: string;
}
