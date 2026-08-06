export interface ExplorerFolderNode {
  id: string;
  type: 'folder';
  name: string;
  path: string;
  children: ExplorerNode[];
}

export type FileReviewStatus = 'accepted' | 'pending' | 'rejected';

export interface ExplorerFileNode {
  id: string;
  type: 'file';
  name: string;
  path: string;
  language: string | null;
  reviewStatus?: FileReviewStatus;
}

export type ExplorerNode = ExplorerFolderNode | ExplorerFileNode;

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  destructive?: boolean;
  onSelect: () => void;
}
