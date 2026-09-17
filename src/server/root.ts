import { createTRPCRouter } from "@/server/trpc";
import { workspaceRouter } from "@/server/routers/workspace";
import { projectRouter } from "@/server/routers/project";
import { serviceRouter } from "@/server/routers/service";
import { deploymentRouter } from "@/server/routers/deployment";
import { githubRouter } from "@/server/routers/github";
import { databaseRouter } from "@/server/routers/database";
import { bucketRouter } from "@/server/routers/bucket";
import { domainRouter } from "@/server/routers/domain";
import { volumeRouter } from "@/server/routers/volume";
import { metricsRouter } from "@/server/routers/metrics";
import { tokenRouter } from "@/server/routers/token";

/**
 * Root tRPC router — all sub-routers are merged here.
 * The dashboard and (Phase 4) public API consume this same router.
 * FR-API-01: dashboard SHALL consume the same API, not a privileged internal one.
 */
export const appRouter = createTRPCRouter({
  workspace: workspaceRouter,
  project: projectRouter,
  service: serviceRouter,
  deployment: deploymentRouter,
  github: githubRouter,
  database: databaseRouter,
  bucket: bucketRouter,
  domain: domainRouter,
  volume: volumeRouter,
  metrics: metricsRouter,
  token: tokenRouter,
});

export type AppRouter = typeof appRouter;
