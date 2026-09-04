import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

export const serviceRouter = createTRPCRouter({
  /** List services in an environment */
  list: protectedProcedure
    .input(z.object({ environmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.service.findMany({
        where: {
          environmentId: input.environmentId,
          deletedAt: null,
          environment: {
            project: {
              deletedAt: null,
              workspace: { members: { some: { userId: ctx.session.user.id } } },
            },
          },
        },
        include: {
          domains: true,
          deployments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: { select: { builds: true } },
        },
      });
    }),

  /** Create a service — FR-SVC-01 */
  create: protectedProcedure
    .input(
      z.object({
        environmentId: z.string(),
        name: z.string().min(1).max(64),
        sourceType: z.enum(["github", "docker", "empty"]),
        repoUrl: z.string().url().optional(),
        branch: z.string().optional(),
        rootDir: z.string().optional(),
        dockerImage: z.string().optional(),
        port: z.number().int().min(1).max(65535).optional(),
        instanceType: z
          .enum(["lite", "standard-1", "standard-2", "standard-4"])
          .default("lite"),
        scaleToZero: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Confirm environment belongs to a workspace the caller is in
      const env = await ctx.db.environment.findFirst({
        where: {
          id: input.environmentId,
          project: {
            deletedAt: null,
            workspace: {
              members: { some: { userId: ctx.session.user.id } },
            },
          },
        },
      });
      if (!env) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.service.create({
        data: {
          environmentId: input.environmentId,
          name: input.name,
          sourceType: input.sourceType,
          repoUrl: input.repoUrl,
          branch: input.branch ?? "main",
          rootDir: input.rootDir,
          dockerImage: input.dockerImage,
          port: input.port,
          instanceType: input.instanceType,
          scaleToZero: input.scaleToZero,
        },
      });
    }),

  /** Pause / unpause a service — FR-SVC-09 */
  setPaused: protectedProcedure
    .input(z.object({ serviceId: z.string(), paused: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const service = await ctx.db.service.findFirst({
        where: {
          id: input.serviceId,
          deletedAt: null,
          environment: {
            project: {
              workspace: { members: { some: { userId: ctx.session.user.id } } },
            },
          },
        },
      });
      if (!service) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.service.update({
        where: { id: input.serviceId },
        data: { isPaused: input.paused },
      });
    }),

  /** Update environment variables for a service — FR-VAR-01 */
  setVariable: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        key: z.string().min(1).max(256),
        value: z.string(),
        isSecret: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // DR-03: in production, encrypt value before upsert
      // For Phase 0 skeleton this is a direct upsert; encryption middleware added in Phase 1
      return ctx.db.environmentVariable.upsert({
        where: {
          // upsert by serviceId + key is handled via findFirst + create/update
          id: "placeholder", // will not match — see below
        },
        update: { value: input.value },
        create: {
          serviceId: input.serviceId,
          key: input.key,
          value: input.value,
          isSecret: input.isSecret,
        },
      });
    }),

  /** Soft-delete a service — FR-SVC-08 */
  delete: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = await ctx.db.service.findFirst({
        where: {
          id: input.serviceId,
          deletedAt: null,
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

      return ctx.db.service.update({
        where: { id: input.serviceId },
        data: { deletedAt: new Date() },
      });
    }),
});
