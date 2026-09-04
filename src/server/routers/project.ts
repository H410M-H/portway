import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

/** Helper — verify caller is a member of the workspace containing this project */
async function assertProjectAccess(
  db: TRPCContext["db"],
  userId: string,
  projectId: string
) {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      deletedAt: null,
      workspace: { members: { some: { userId } } },
    },
    include: { workspace: { include: { members: true } } },
  });
  if (!project) throw new TRPCError({ code: "NOT_FOUND" });
  return project;
}

import type { TRPCContext } from "@/server/trpc";

export const projectRouter = createTRPCRouter({
  /** List projects in a workspace */
  list: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.project.findMany({
        where: {
          workspaceId: input.workspaceId,
          deletedAt: null,
          workspace: { members: { some: { userId: ctx.session.user.id } } },
        },
        include: {
          environments: {
            include: {
              services: {
                where: { deletedAt: null },
                include: {
                  deployments: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  /** Get a single project by id */
  byId: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return assertProjectAccess(ctx.db, ctx.session.user.id, input.projectId);
    }),

  /** Create a project */
  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string().min(1).max(64),
        description: z.string().max(256).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Confirm user is a member of the workspace
      const member = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: ctx.session.user.id,
          },
        },
      });
      if (!member) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.project.create({
        data: {
          workspaceId: input.workspaceId,
          name: input.name,
          description: input.description,
          environments: {
            create: {
              name: "production",
              isDefault: true,
            },
          },
        },
        include: { environments: true },
      });
    }),

  /** Soft-delete a project — FR-PROJ-07 (7-day recovery window) */
  delete: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        confirmName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await assertProjectAccess(
        ctx.db,
        ctx.session.user.id,
        input.projectId
      );

      if (input.confirmName !== project.name) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Project name confirmation does not match.",
        });
      }

      return ctx.db.project.update({
        where: { id: input.projectId },
        data: { deletedAt: new Date() },
      });
    }),

  /** Create an additional environment */
  createEnvironment: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().min(1).max(32),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectAccess(ctx.db, ctx.session.user.id, input.projectId);

      return ctx.db.environment.create({
        data: {
          projectId: input.projectId,
          name: input.name,
        },
      });
    }),
});
