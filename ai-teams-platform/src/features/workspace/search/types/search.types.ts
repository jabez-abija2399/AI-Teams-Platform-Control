export type SearchScope = 'quick' | 'project' | 'file' | 'global';

export interface SearchResult {
  id: string;
  type: 'project' | 'file' | 'folder';
  label: string;
  path: string;
  matchContext?: string;
}

export interface SearchProvider {
  scope: SearchScope;
  search(query: string): Promise<SearchResult[]>;
}
