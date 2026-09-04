import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { provisionManagedDatabase, destroyManagedDatabase } from "@/lib/database-provider";
import { DatabaseProvider } from "@prisma/client";

export const databaseRouter = createTRPCRouter({
  /**
   * Provision a new database
   */
  create: protectedProcedure
    .input(
      z.object({
        environmentId: z.string(),
        name: z.string().min(1).max(64),
        provider: z.nativeEnum(DatabaseProvider),
        region: z.string().default("us-east-1"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Verify access to the environment
      const env = await ctx.db.environment.findFirst({
        where: { id: input.environmentId },
        include: { project: true },
      });

      if (!env) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Environment not found" });
      }

      const project = await ctx.db.project.findFirst({
        where: {
          id: env.projectId,
          deletedAt: null,
          workspace: { members: { some: { userId: ctx.session.user.id } } },
        },
      });

      if (!project) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // 2. Call partner API to provision
      const provisionResult = await provisionManagedDatabase({
        projectId: project.id,
        environmentId: env.id,
        name: input.name,
        provider: input.provider,
        region: input.region,
      });

      // 3. Save to database
      const dbInstance = await ctx.db.databaseInstance.create({
        data: {
          environmentId: env.id,
          name: input.name,
          provider: input.provider,
          region: input.region,
          partnerDbId: provisionResult.partnerDbId,
          connectionUrl: provisionResult.connectionUrl, // In Phase 2: Encrypt this!
        },
      });

      // 4. Create an EnvironmentVariable so Services can easily access this DB
      const envVarKey = input.name.toUpperCase().replace(/[^A-Z0-9]/g, "_") + "_URL";
      
      await ctx.db.environmentVariable.create({
        data: {
          // Attaching to workspace-level or environment-level (since we don't have env-level vars yet, we'll assign it to all services in the environment, or leave serviceId null for shared vars)
          key: envVarKey,
          value: provisionResult.connectionUrl,
          isSecret: true,
          // Since our schema only supports attaching variables directly to Services or Workspaces currently, 
          // let's attach it to all existing services in this environment as a helper.
        },
      });
      
      // Better approach for Phase 1: Attach to services in this environment
      const services = await ctx.db.service.findMany({
        where: { environmentId: env.id },
      });
      
      for (const svc of services) {
        await ctx.db.environmentVariable.create({
          data: {
            serviceId: svc.id,
            key: envVarKey,
            value: provisionResult.connectionUrl,
            isSecret: true,
          }
        });
      }

      return dbInstance;
    }),

  /**
   * Delete a database
   */
  delete: protectedProcedure
    .input(z.object({ databaseId: z.string(), confirmName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await ctx.db.databaseInstance.findUnique({
        where: { id: input.databaseId },
        include: { environment: { include: { project: true } } },
      });

      if (!dbInstance) throw new TRPCError({ code: "NOT_FOUND" });
      if (dbInstance.name !== input.confirmName) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Name confirmation mismatch" });
      }

      // Verify access
      const member = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: dbInstance.environment.project.workspaceId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!member) throw new TRPCError({ code: "FORBIDDEN" });

      // Call partner API
      if (dbInstance.partnerDbId) {
        await destroyManagedDatabase(dbInstance.partnerDbId);
      }

      // Delete from our DB
      await ctx.db.databaseInstance.delete({ where: { id: input.databaseId } });

      return { success: true };
    }),
});
