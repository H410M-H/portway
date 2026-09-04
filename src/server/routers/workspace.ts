import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

export const workspaceRouter = createTRPCRouter({
  /** List all workspaces the current user belongs to */
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.workspace.findMany({
      where: {
        members: { some: { userId: ctx.session.user.id } },
      },
      include: {
        members: { include: { user: true } },
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }),

  /** Get a single workspace by slug — scoped to the calling user */
  bySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const workspace = await ctx.db.workspace.findFirst({
        where: {
          slug: input.slug,
          members: { some: { userId: ctx.session.user.id } },
        },
        include: {
          members: { include: { user: true } },
          _count: { select: { projects: true } },
        },
      });
      if (!workspace) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return workspace;
    }),

  /** Create a team workspace */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64),
        slug: z.string().min(2).max(48).regex(/^[a-z0-9-]+$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.workspace.findUnique({
        where: { slug: input.slug },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A workspace with this slug already exists.",
        });
      }

      const workspace = await ctx.db.workspace.create({
        data: {
          name: input.name,
          slug: input.slug,
          members: {
            create: { userId: ctx.session.user.id, role: "OWNER" },
          },
        },
      });

      await ctx.db.auditLogEntry.create({
        data: {
          workspaceId: workspace.id,
          actorUserId: ctx.session.user.id,
          action: "workspace.created",
        },
      });

      return workspace;
    }),

  /** Invite a member by email */
  invite: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        email: z.string().email().optional(),
        role: z.enum(["MEMBER", "VIEWER"]).default("MEMBER"),
        expiresInDays: z.number().min(1).max(30).default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only owners can invite — FR-AUTH-06
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: ctx.session.user.id,
          },
        },
      });
      if (!membership || membership.role !== "OWNER") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const invite = await ctx.db.workspaceInvite.create({
        data: {
          workspaceId: input.workspaceId,
          email: input.email,
          role: input.role,
          expiresAt: new Date(
            Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000
          ),
        },
      });

      await ctx.db.auditLogEntry.create({
        data: {
          workspaceId: input.workspaceId,
          actorUserId: ctx.session.user.id,
          action: "member.invited",
          metadata: { email: input.email, role: input.role },
        },
      });

      return invite;
    }),

  /** Get audit log for a workspace — owners only */
  auditLog: protectedProcedure
    .input(z.object({ workspaceId: z.string(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: ctx.session.user.id,
          },
        },
      });
      if (!membership || membership.role !== "OWNER") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.auditLogEntry.findMany({
        where: { workspaceId: input.workspaceId },
        include: { actor: true },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),
});
