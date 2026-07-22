export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
}

export interface GitHubRepo {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  created_at: string;
  updated_at: string;
}

export interface GitIntegrationState {
  id: string;
  projectId: string;
  provider: string;
  githubUsername: string | null;
  githubUserId: number | null;
  repoUrl: string | null;
  repoName: string | null;
  repoOwner: string | null;
  defaultBranch: string;
  connectedAt: Date;
}

export interface CreateRepoInput {
  name: string;
  description?: string;
  private?: boolean;
}

export interface PushInput {
  projectId: string;
  message: string;
  branch?: string;
}

export interface CreatePRInput {
  projectId: string;
  title: string;
  body?: string;
  head: string;
  base?: string;
}

export interface GitSyncStatus {
  ahead: number;
  behind: number;
  synced: boolean;
  lastSyncAt: Date | null;
}

export interface PRInfo {
  id: string;
  number: number;
  title: string;
  body: string | null;
  state: string;
  headBranch: string;
  baseBranch: string;
  mergedAt: Date | null;
  createdAt: Date;
}
