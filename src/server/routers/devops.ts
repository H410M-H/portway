import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import {
  listCronsForService,
  createCronJob,
  toggleCronJob,
  deleteCronJob,
  executeCronJob,
  getCronRunLogs,
  getCronJobById,
} from "@/lib/devops/cron-engine";
import {
  getDefaultWafConfig,
  updateWafConfig,
  getSecurityEvents,
} from "@/lib/devops/waf-engine";
import {
  getCanaryConfig,
  updateCanaryWeight,
  promoteCanary,
  rollbackCanary,
} from "@/lib/devops/canary-engine";
import { autoTuneFramework } from "@/lib/devops/auto-tuner";
import { diagnoseBuildLogs } from "@/lib/devops/ai-diagnostics";
import { parseVercelConfig, applyVercelMigration } from "@/lib/devops/vercel-migrator";

/**
 * RBAC Helper: Asserts caller has access to the workspace containing the service
 */
async function assertDevopsAccess(
  db: any,
  userId: string,
  serviceId: string,
  allowedRoles: ("OWNER" | "MEMBER" | "VIEWER")[] = ["OWNER", "MEMBER"]
) {
  const service = await db.service.findFirst({
    where: {
      id: serviceId,
      deletedAt: null,
      environment: {
        project: {
          deletedAt: null,
          workspace: {
            members: {
              some: {
                userId,
                role: { in: allowedRoles },
              },
            },
          },
        },
      },
    },
    include: {
      environment: {
        include: {
          project: {
            include: {
              workspace: true,
            },
          },
        },
      },
    },
  });

  if (!service) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Insufficient permissions or service not found in your workspaces",
    });
  }

  return service;
}

/**
 * RBAC Helper for cron-based actions: resolves serviceId from cron ID and verifies permissions
 */
async function assertCronAccess(
  db: any,
  userId: string,
  cronId: string,
  allowedRoles: ("OWNER" | "MEMBER" | "VIEWER")[] = ["OWNER", "MEMBER"]
) {
  const cron = getCronJobById(cronId);
  if (!cron) {
    throw new TRPCError({ code: "NOT_FOUND", message: `Cron job not found: ${cronId}` });
  }
  await assertDevopsAccess(db, userId, cron.serviceId, allowedRoles);
  return cron;
}

export const devopsRouter = createTRPCRouter({
  // ─── CRON SCHEDULER ────────────────────────────────────────────────────────
  listCrons: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertDevopsAccess(ctx.db, ctx.session.user.id, input.serviceId, ["OWNER", "MEMBER", "VIEWER"]);
      return listCronsForService(input.serviceId);
    }),

  createCron: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        name: z.string().min(1).max(100),
        schedule: z.string().min(5),
        path: z.string().min(1),
        method: z.enum(["GET", "POST"]).default("GET"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertDevopsAccess(ctx.db, ctx.session.user.id, input.serviceId, ["OWNER", "MEMBER"]);
      try {
        return createCronJob(input);
      } catch (err: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
      }
    }),

  toggleCron: protectedProcedure
    .input(z.object({ cronId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await assertCronAccess(ctx.db, ctx.session.user.id, input.cronId, ["OWNER", "MEMBER"]);
      try {
        return toggleCronJob(input.cronId, input.enabled);
      } catch (err: any) {
        throw new TRPCError({ code: "NOT_FOUND", message: err.message });
      }
    }),

  triggerCron: protectedProcedure
    .input(z.object({ cronId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertCronAccess(ctx.db, ctx.session.user.id, input.cronId, ["OWNER", "MEMBER"]);
      try {
        return await executeCronJob(input.cronId);
      } catch (err: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
      }
    }),

  deleteCron: protectedProcedure
    .input(z.object({ cronId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertCronAccess(ctx.db, ctx.session.user.id, input.cronId, ["OWNER", "MEMBER"]);
      return { success: deleteCronJob(input.cronId) };
    }),

  getCronLogs: protectedProcedure
    .input(z.object({ cronId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertCronAccess(ctx.db, ctx.session.user.id, input.cronId, ["OWNER", "MEMBER", "VIEWER"]);
      return getCronRunLogs(input.cronId);
    }),

  // ─── WAF & RATE LIMITING ───────────────────────────────────────────────────
  getWafConfig: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertDevopsAccess(ctx.db, ctx.session.user.id, input.serviceId, ["OWNER", "MEMBER", "VIEWER"]);
      return getDefaultWafConfig(input.serviceId);
    }),

  updateWafConfig: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        enabled: z.boolean().optional(),
        rateLimitRpm: z.number().int().min(10).max(50000).optional(),
        rateLimitAction: z.enum(["BLOCK_429", "CHALLENGE"]).optional(),
        ddosShieldEnabled: z.boolean().optional(),
        botProtectionEnabled: z.boolean().optional(),
        ipBlocklist: z.array(z.string()).optional(),
        ipAllowlist: z.array(z.string()).optional(),
        geoBlockCountries: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertDevopsAccess(ctx.db, ctx.session.user.id, input.serviceId, ["OWNER", "MEMBER"]);
      const { serviceId, ...partial } = input;
      return updateWafConfig(serviceId, partial);
    }),

  getSecurityEvents: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertDevopsAccess(ctx.db, ctx.session.user.id, input.serviceId, ["OWNER", "MEMBER", "VIEWER"]);
      return getSecurityEvents(input.serviceId);
    }),

  // ─── CANARY & ROLLING RELEASES ─────────────────────────────────────────────
  getCanaryConfig: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertDevopsAccess(ctx.db, ctx.session.user.id, input.serviceId, ["OWNER", "MEMBER", "VIEWER"]);
      return getCanaryConfig(input.serviceId);
    }),

  updateCanaryWeight: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        weightPercent: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertDevopsAccess(ctx.db, ctx.session.user.id, input.serviceId, ["OWNER", "MEMBER"]);
      return updateCanaryWeight(input.serviceId, input.weightPercent);
    }),

  promoteCanary: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertDevopsAccess(ctx.db, ctx.session.user.id, input.serviceId, ["OWNER", "MEMBER"]);
      return promoteCanary(input.serviceId);
    }),

  rollbackCanary: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertDevopsAccess(ctx.db, ctx.session.user.id, input.serviceId, ["OWNER", "MEMBER"]);
      return rollbackCanary(input.serviceId);
    }),

  // ─── ZERO-CONFIG AUTO-TUNER ────────────────────────────────────────────────
  autoTune: protectedProcedure
    .input(
      z.object({
        files: z.array(z.string()),
        packageJsonSnippet: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return autoTuneFramework(input.files, input.packageJsonSnippet);
    }),

  // ─── AI DEPLOY DIAGNOSTICS ─────────────────────────────────────────────────
  diagnoseLogs: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        logLines: z.array(z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      await assertDevopsAccess(ctx.db, ctx.session.user.id, input.serviceId, ["OWNER", "MEMBER", "VIEWER"]);
      return diagnoseBuildLogs(input.logLines);
    }),

  // ─── VERCEL CLI PARSER & MIGRATOR ──────────────────────────────────────────
  parseVercelConfig: protectedProcedure
    .input(z.object({ rawJson: z.string() }))
    .query(async ({ input }) => {
      try {
        return parseVercelConfig(input.rawJson);
      } catch (err: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
      }
    }),

  applyVercelMigration: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        rawJson: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertDevopsAccess(ctx.db, ctx.session.user.id, input.serviceId, ["OWNER", "MEMBER"]);
      try {
        const plan = parseVercelConfig(input.rawJson);
        const result = applyVercelMigration(input.serviceId, plan);
        return {
          success: true,
          plan,
          result,
        };
      } catch (err: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
      }
    }),
});
