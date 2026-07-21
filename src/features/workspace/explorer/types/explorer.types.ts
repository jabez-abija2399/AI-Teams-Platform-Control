export interface ExplorerFolderNode {
  id: string;
  type: 'folder';
  name: string;
  path: string;
  children: ExplorerNode[];
}

export interface ExplorerFileNode {
  id: string;
  type: 'file';
  name: string;
  path: string;
  language: string | null;
}

export type ExplorerNode = ExplorerFolderNode | ExplorerFileNode;

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  destructive?: boolean;
  onSelect: () => void;
}
