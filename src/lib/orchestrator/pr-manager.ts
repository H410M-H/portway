import { db } from "@/lib/db";
import { executeDeployment } from "./engine";

export interface GitHubPullRequestEvent {
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
    html_url: string;
    full_name: string;
  };
}

export async function handlePullRequestWebhook(event: GitHubPullRequestEvent) {
  const repoUrl = event.repository.html_url;
  const prNumber = event.number;
  const branch = event.pull_request.head.ref;
  const commitSha = event.pull_request.head.sha;

  // Find all services referencing this repo
  const services = await db.service.findMany({
    where: {
      repoUrl,
      sourceType: "github",
      deletedAt: null,
    },
    include: {
      variables: true,
      environment: {
        include: {
          project: true,
        },
      },
    },
  });

  if (services.length === 0) return { matched: 0 };

  const results = [];

  for (const service of services) {
    const project = service.environment.project;
    const envName = `pr-${prNumber}`;

    if (event.action === "closed") {
      // PR merged or closed — teardown preview environment
      const prEnv = await db.environment.findFirst({
        where: {
          projectId: project.id,
          name: envName,
        },
      });

      if (prEnv) {
        await db.environment.delete({ where: { id: prEnv.id } }).catch(() => null);
      }
      results.push({ serviceId: service.id, action: "cleaned_up", prNumber });
      continue;
    }

    if (event.action === "opened" || event.action === "synchronize" || event.action === "reopened") {
      // Find or create the ephemeral environment
      let prEnv = await db.environment.findFirst({
        where: {
          projectId: project.id,
          name: envName,
        },
      });

      if (!prEnv) {
        prEnv = await db.environment.create({
          data: {
            projectId: project.id,
            name: envName,
            isPrEnv: true,
            prNumber,
          },
        });
      }

      // Find or clone service in the preview environment
      let prService = await db.service.findFirst({
        where: {
          environmentId: prEnv.id,
          name: service.name,
        },
        include: {
          variables: true,
        },
      });

      if (!prService) {
        prService = await db.service.create({
          data: {
            environmentId: prEnv.id,
            name: service.name,
            sourceType: "github",
            repoUrl: service.repoUrl,
            branch,
            port: service.port,
            buildCommand: service.buildCommand,
            startCommand: service.startCommand,
          },
          include: {
            variables: true,
          },
        });

        // Clone variables from the base service
        for (const v of service.variables) {
          await db.environmentVariable.create({
            data: {
              serviceId: prService.id,
              key: v.key,
              value: v.value,
              isSecret: v.isSecret,
            },
          }).catch(() => null);
        }
      }

      // Trigger build & deployment
      const build = await db.build.create({
        data: {
          serviceId: prService.id,
          commitSha,
          commitMessage: event.pull_request.title,
          triggeredBy: `github-pr-${prNumber}`,
          status: "QUEUED",
        },
      });

      const deployment = await db.deployment.create({
        data: {
          serviceId: prService.id,
          buildId: build.id,
          triggeredBy: `github-pr-${prNumber}`,
          status: "QUEUED",
        },
      });

      executeDeployment(deployment.id, build.id, prService.id, {
        serviceId: prService.id,
        commitSha,
        commitMessage: `PR #${prNumber}: ${event.pull_request.title}`,
      }).catch((e) => console.error("PR deploy error:", e));

      results.push({ serviceId: prService.id, deploymentId: deployment.id, prNumber });
    }
  }

  return { matched: services.length, results };
}
