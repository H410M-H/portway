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

export const devopsRouter = createTRPCRouter({
  // ─── CRON SCHEDULER ────────────────────────────────────────────────────────
  listCrons: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .query(async ({ input }) => {
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
    .mutation(async ({ input }) => {
      try {
        return createCronJob(input);
      } catch (err: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
      }
    }),

  toggleCron: protectedProcedure
    .input(z.object({ cronId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      try {
        return toggleCronJob(input.cronId, input.enabled);
      } catch (err: any) {
        throw new TRPCError({ code: "NOT_FOUND", message: err.message });
      }
    }),

  triggerCron: protectedProcedure
    .input(z.object({ cronId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await executeCronJob(input.cronId);
      } catch (err: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
      }
    }),

  deleteCron: protectedProcedure
    .input(z.object({ cronId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: deleteCronJob(input.cronId) };
    }),

  getCronLogs: protectedProcedure
    .input(z.object({ cronId: z.string() }))
    .query(async ({ input }) => {
      return getCronRunLogs(input.cronId);
    }),

  // ─── WAF & RATE LIMITING ───────────────────────────────────────────────────
  getWafConfig: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .query(async ({ input }) => {
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
    .mutation(async ({ input }) => {
      const { serviceId, ...partial } = input;
      return updateWafConfig(serviceId, partial);
    }),

  getSecurityEvents: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .query(async ({ input }) => {
      return getSecurityEvents(input.serviceId);
    }),

  // ─── CANARY & ROLLING RELEASES ─────────────────────────────────────────────
  getCanaryConfig: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .query(async ({ input }) => {
      return getCanaryConfig(input.serviceId);
    }),

  updateCanaryWeight: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        weightPercent: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ input }) => {
      return updateCanaryWeight(input.serviceId, input.weightPercent);
    }),

  promoteCanary: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .mutation(async ({ input }) => {
      return promoteCanary(input.serviceId);
    }),

  rollbackCanary: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .mutation(async ({ input }) => {
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
    .query(async ({ input }) => {
      return diagnoseBuildLogs(input.logLines);
    }),
});
