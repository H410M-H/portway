import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

export const deploymentRouter = createTRPCRouter({
  /** Get deployment history for a service */
  list: protectedProcedure
    .input(
      z.object({ serviceId: z.string(), limit: z.number().default(20) })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.deployment.findMany({
        where: {
          serviceId: input.serviceId,
          service: {
            environment: {
              project: {
                workspace: {
                  members: { some: { userId: ctx.session.user.id } },
                },
              },
            },
          },
        },
        include: { build: true },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  /** Get current/latest deployment for a service */
  latest: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.deployment.findFirst({
        where: {
          serviceId: input.serviceId,
          service: {
            environment: {
              project: {
                workspace: {
                  members: { some: { userId: ctx.session.user.id } },
                },
              },
            },
          },
        },
        include: { build: true },
        orderBy: { createdAt: "desc" },
      });
    }),

  /**
   * Trigger a manual deployment — FR-DEP-01, FR-SVC-05
   * Phase 0: creates the DB records and queues the job.
   * Phase 1: orchestrator picks up the job and calls Cloudflare Containers API.
   */
  trigger: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        commitSha: z.string().optional(),
        commitMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = await ctx.db.service.findFirst({
        where: {
          id: input.serviceId,
          deletedAt: null,
          isPaused: false,
          environment: {
            project: {
              workspace: {
                members: {
                  some: {
                    userId: ctx.session.user.id,
                    role: { in: ["OWNER", "MEMBER"] },
                  },
                },
              },
            },
          },
        },
      });
      if (!service) throw new TRPCError({ code: "NOT_FOUND" });

      // Create Build record
      const build = await ctx.db.build.create({
        data: {
          serviceId: input.serviceId,
          commitSha: input.commitSha,
          commitMessage: input.commitMessage,
          triggeredBy: ctx.session.user.id,
          status: "QUEUED",
        },
      });

      // Create Deployment record — status will be updated by the orchestrator
      const deployment = await ctx.db.deployment.create({
        data: {
          serviceId: input.serviceId,
          buildId: build.id,
          triggeredBy: ctx.session.user.id,
          status: "QUEUED",
        },
      });

      // TODO Phase 1: enqueue job to orchestrator → Cloudflare Containers API
      // await queue.enqueue("build-and-deploy", { buildId: build.id, deploymentId: deployment.id })

      return { build, deployment };
    }),

  /** Rollback to a previous deployment — FR-DEP-04 */
  redeploy: protectedProcedure
    .input(z.object({ deploymentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prev = await ctx.db.deployment.findFirst({
        where: {
          id: input.deploymentId,
          status: "ACTIVE",
          service: {
            environment: {
              project: {
                workspace: {
                  members: {
                    some: {
                      userId: ctx.session.user.id,
                      role: { in: ["OWNER", "MEMBER"] },
                    },
                  },
                },
              },
            },
          },
        },
        include: { build: true },
      });
      if (!prev) throw new TRPCError({ code: "NOT_FOUND" });

      // Reuse cached build image — FR-BLD-07
      const deployment = await ctx.db.deployment.create({
        data: {
          serviceId: prev.serviceId,
          buildId: prev.buildId,
          triggeredBy: ctx.session.user.id,
          status: "QUEUED",
        },
      });

      return deployment;
    }),
});
