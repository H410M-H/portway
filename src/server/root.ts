import { createTRPCRouter } from "@/server/trpc";
import { workspaceRouter } from "@/server/routers/workspace";
import { projectRouter } from "@/server/routers/project";
import { serviceRouter } from "@/server/routers/service";
import { deploymentRouter } from "@/server/routers/deployment";
import { githubRouter } from "@/server/routers/github";

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
});

export type AppRouter = typeof appRouter;
