import { db } from "@/lib/db";
import { Octokit } from "@octokit/rest";

/**
 * Creates an Octokit instance for the given user's GitHub account.
 * Requires the user to have connected their GitHub account via NextAuth
 * and for us to have their access_token saved in the Account model.
 */
export async function getGitHubClientForUser(userId: string) {
  const account = await db.account.findFirst({
    where: {
      userId: userId,
      provider: "github",
    },
  });

  if (!account || !account.access_token) {
    throw new Error("GitHub account not connected or access token missing");
  }

  return new Octokit({ auth: account.access_token });
}

/**
 * Creates a webhook on a specific GitHub repository.
 */
export async function createRepoWebhook(
  userId: string,
  owner: string,
  repo: string,
  webhookUrl: string,
  secret: string
) {
  const octokit = await getGitHubClientForUser(userId);

  try {
    const response = await octokit.rest.repos.createWebhook({
      owner,
      repo,
      name: "web",
      active: true,
      events: ["push", "pull_request"],
      config: {
        url: webhookUrl,
        content_type: "json",
        secret: secret,
        insecure_ssl: "0",
      },
    });

    return response.data;
  } catch (error: any) {
    // If webhook already exists, GitHub might return 422
    if (error.status === 422) {
      console.warn(`Webhook already exists for ${owner}/${repo}`);
      return null;
    }
    throw error;
  }
}

/**
 * Fetches the list of repositories the user has access to.
 */
export async function listUserRepos(userId: string) {
  const octokit = await getGitHubClientForUser(userId);
  
  // Use pagination if needed, taking first 100 for now
  const response = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
  });

  return response.data;
}
