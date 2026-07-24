import { Octokit } from '@octokit/rest';

/**
 * Initializes an Octokit REST client using the provided user OAuth access token.
 */
export function getOctokitClient(accessToken: string): Octokit {
  if (!accessToken) {
    throw new Error('GitHub OAuth access token is required');
  }

  return new Octokit({
    auth: accessToken,
  });
}
