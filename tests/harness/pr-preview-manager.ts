/**
 * Portway PaaS — GitHub Push & Ephemeral PR Previews Manager (F19, F20)
 * Handles GitHub push events, PR preview lifecycle (opened, synchronize, closed),
 * dynamic pr-<num> environment provisioning, variable cloning, and resource cleanup.
 */

export interface GitHubPushPayload {
  ref: string; // e.g. "refs/heads/main"
  repository: {
    name: string;
    full_name: string;
    clone_url: string;
    default_branch: string;
  };
  head_commit: {
    id: string;
    message: string;
    author: { name: string; email: string };
  };
}

export interface GitHubPullRequestPayload {
  action: "opened" | "synchronize" | "closed" | "reopened";
  number: number;
  pull_request: {
    title: string;
    merged: boolean;
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
    };
  };
  repository: {
    name: string;
    full_name: string;
  };
}

export interface EphemeralEnvironment {
  id: string;
  projectId: string;
  name: string; // "pr-<num>"
  prNumber: number;
  isPrEnv: boolean;
  status: "ACTIVE" | "CLEANED_UP";
  clonedVariables: Record<string, string>;
  previewUrl: string;
  createdAt: string;
  closedAt?: string;
  deployments: { commitSha: string; status: string }[];
}

export class PrPreviewManager {
  private environments = new Map<number, EphemeralEnvironment>();

  processPushWebhook(
    payload: GitHubPushPayload,
    watchedBranch = "main"
  ): { shouldDeploy: boolean; branch: string; commitSha: string } {
    const branch = payload.ref.replace(/^refs\/heads\//, "");
    const shouldDeploy = branch === watchedBranch;
    return {
      shouldDeploy,
      branch,
      commitSha: payload.head_commit.id,
    };
  }

  handlePullRequestWebhook(
    payload: GitHubPullRequestPayload,
    options?: {
      projectId?: string;
      serviceName?: string;
      baseVariables?: Record<string, string>;
    }
  ): {
    action: string;
    environment?: EphemeralEnvironment;
    commentBody?: string;
    message: string;
  } {
    const prNumber = payload.number;
    const serviceName = options?.serviceName || "web";
    const projectId = options?.projectId || "proj_123";
    const previewSubdomain = `${serviceName}-pr-${prNumber}.portway.app`;

    switch (payload.action) {
      case "opened":
      case "reopened": {
        const env: EphemeralEnvironment = {
          id: `env_pr_${prNumber}_${Date.now()}`,
          projectId,
          name: `pr-${prNumber}`,
          prNumber,
          isPrEnv: true,
          status: "ACTIVE",
          clonedVariables: { ...(options?.baseVariables || {}) },
          previewUrl: `https://${previewSubdomain}`,
          createdAt: new Date().toISOString(),
          deployments: [
            {
              commitSha: payload.pull_request.head.sha,
              status: "ACTIVE",
            },
          ],
        };
        this.environments.set(prNumber, env);

        const commentBody = `### 🚀 Portway Ephemeral Preview Ready\n\nPreview URL: [https://${previewSubdomain}](https://${previewSubdomain})\nCommit: \`${payload.pull_request.head.sha.slice(0, 7)}\`\nStatus: **Active**`;

        return {
          action: payload.action,
          environment: env,
          commentBody,
          message: `Spawned ephemeral preview environment for PR #${prNumber}`,
        };
      }

      case "synchronize": {
        const env = this.environments.get(prNumber);
        if (!env) {
          throw new Error(`Cannot synchronize: preview environment for PR #${prNumber} does not exist`);
        }
        env.deployments.push({
          commitSha: payload.pull_request.head.sha,
          status: "ACTIVE",
        });

        const commentBody = `### 🔄 Portway Ephemeral Preview Updated\n\nPreview URL: [${env.previewUrl}](${env.previewUrl})\nNew Commit: \`${payload.pull_request.head.sha.slice(0, 7)}\``;

        return {
          action: "synchronize",
          environment: env,
          commentBody,
          message: `Synchronized PR #${prNumber} with new commit ${payload.pull_request.head.sha}`,
        };
      }

      case "closed": {
        const env = this.environments.get(prNumber);
        if (env) {
          env.status = "CLEANED_UP";
          env.closedAt = new Date().toISOString();
        }
        this.environments.delete(prNumber);

        return {
          action: "closed",
          environment: env,
          message: `Teardown complete for PR #${prNumber} ephemeral environment`,
        };
      }

      default:
        return {
          action: payload.action,
          message: `Unhandled action: ${payload.action}`,
        };
    }
  }

  getEnvironment(prNumber: number): EphemeralEnvironment | undefined {
    return this.environments.get(prNumber);
  }
}
