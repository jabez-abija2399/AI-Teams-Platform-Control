export interface GitRepository {
  id: string;
  projectId: string;
  provider: string;
  path: string;
  currentBranchId: string | null;
}

export interface GitBranchInfo {
  id: string;
  name: string;
  type: string;
  commitCount: number;
  isCurrent: boolean;
}

export interface GitCommitInfo {
  id: string;
  message: string;
  author: string;
  branchName: string;
  createdAt: Date;
  changeCount: number;
}

export interface GitChangeInfo {
  id: string;
  file: string;
  type: string;
  createdAt: Date;
}

export interface GitDiff {
  file: string;
  additions: number;
  deletions: number;
  content: string;
}

export interface GitStatus {
  repositoryId: string;
  currentBranch: string;
  hasChanges: boolean;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
}

export interface GitCreateCommitInput {
  repositoryId: string;
  branchId: string;
  message: string;
  author: string;
  files: { path: string; content: string; changeType: string }[];
}
