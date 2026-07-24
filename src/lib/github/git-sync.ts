import { getOctokitClient } from './octokit-client';

/**
 * Creates a new GitHub repository under the authenticated user's account.
 */
export async function createGitHubRepository(
  accessToken: string,
  repoName: string,
  isPrivate: boolean = true
): Promise<string> {
  const octokit = getOctokitClient(accessToken);

  const response = await octokit.rest.repos.createForAuthenticatedUser({
    name: repoName,
    private: isPrivate,
    auto_init: true,
  });

  return response.data.html_url;
}

/**
 * Pushes multi-file workspace code updates to a GitHub repository in a single atomic commit
 * using the GitHub Git Data API (Blobs -> Tree -> Commit -> Reference).
 */
export async function pushCodeToGitHub(
  accessToken: string,
  repoOwner: string,
  repoName: string,
  branch: string = 'main',
  files: Record<string, string>,
  commitMessage: string = 'Update project code via AI Teams Platform'
): Promise<string> {
  const octokit = getOctokitClient(accessToken);

  // 1. Get reference to target branch
  let refData;
  try {
    const refRes = await octokit.rest.git.getRef({
      owner: repoOwner,
      repo: repoName,
      ref: `heads/${branch}`,
    });
    refData = refRes.data;
  } catch {
    // If branch doesn't exist, create it from default branch or head
    const masterRef = await octokit.rest.git.getRef({
      owner: repoOwner,
      repo: repoName,
      ref: 'heads/main',
    });
    const createdRef = await octokit.rest.git.createRef({
      owner: repoOwner,
      repo: repoName,
      ref: `refs/heads/${branch}`,
      sha: masterRef.data.object.sha,
    });
    refData = createdRef.data;
  }

  const latestCommitSha = refData.object.sha;

  // 2. Create Git Blobs for all files
  const treeItems: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string }> = [];

  for (const [path, content] of Object.entries(files)) {
    const blobRes = await octokit.rest.git.createBlob({
      owner: repoOwner,
      repo: repoName,
      content: Buffer.from(content).toString('base64'),
      encoding: 'base64',
    });

    treeItems.push({
      path,
      mode: '100644',
      type: 'blob',
      sha: blobRes.data.sha,
    });
  }

  // 3. Create a new Git Tree
  const treeRes = await octokit.rest.git.createTree({
    owner: repoOwner,
    repo: repoName,
    base_tree: latestCommitSha,
    tree: treeItems,
  });

  // 4. Create Git Commit
  const commitRes = await octokit.rest.git.createCommit({
    owner: repoOwner,
    repo: repoName,
    message: commitMessage,
    tree: treeRes.data.sha,
    parents: [latestCommitSha],
  });

  // 5. Update Branch Reference to point to new Commit
  await octokit.rest.git.updateRef({
    owner: repoOwner,
    repo: repoName,
    ref: `heads/${branch}`,
    sha: commitRes.data.sha,
  });

  return commitRes.data.sha;
}

/**
 * Clones/pulls an existing GitHub repository tree into the platform workspace file map.
 */
export async function syncRepoToWorkspace(
  accessToken: string,
  repoOwner: string,
  repoName: string,
  branch: string = 'main'
): Promise<Record<string, string>> {
  const octokit = getOctokitClient(accessToken);

  // Get full tree recursively
  const treeRes = await octokit.rest.git.getTree({
    owner: repoOwner,
    repo: repoName,
    tree_sha: branch,
    recursive: 'true',
  });

  const fileMap: Record<string, string> = {};

  for (const item of treeRes.data.tree) {
    if (item.type === 'blob' && item.path && item.sha) {
      try {
        const blobRes = await octokit.rest.git.getBlob({
          owner: repoOwner,
          repo: repoName,
          file_sha: item.sha,
        });

        const content = Buffer.from(blobRes.data.content, 'base64').toString('utf-8');
        fileMap[item.path] = content;
      } catch (err) {
        console.warn(`[GitHub Sync] Could not fetch blob for ${item.path}:`, err);
      }
    }
  }

  return fileMap;
}
