export type {
  GitRepository,
  GitBranchInfo,
  GitCommitInfo,
  GitChangeInfo,
  GitDiff,
  GitStatus,
  GitCreateCommitInput,
} from './types';

export {
  branchNameSchema,
  commitMessageSchema,
  branchTypeSchema,
  fileChangeInputSchema,
  createCommitSchema,
  createBranchSchema,
} from './schemas/git.schema';

export type {
  BranchNameInput,
  CommitMessageInput,
  BranchType,
  FileChangeInput,
  CreateCommitInput,
  CreateBranchInput,
} from './schemas/git.schema';

export {
  createRepository,
  getRepository,
  listBranches,
  createBranch,
  deleteBranch,
  switchBranch,
  listCommits,
  getCommit,
  listChanges,
  createCommit,
  getDiff,
  getStatus,
} from './services/git.service';

export {
  useGitRepository,
  useCreateRepository,
  useGitBranches,
  useCreateBranch,
  useDeleteBranch,
  useSwitchBranch,
  useGitCommits,
  useGitCommit,
  useGitChanges,
  useCreateCommit,
  useGitDiff,
  useGitStatus,
} from './hooks/use-git';

export { BranchManager } from './components/branch-manager';
export { CommitHistory } from './components/commit-history';
export { DiffViewer } from './components/diff-viewer';
export { GitPanel } from './components/git-panel';
export { StatusIndicator } from './components/status-indicator';
