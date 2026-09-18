import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { listUserRepos, createRepoWebhook } from "@/lib/github";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";

export const githubRouter = createTRPCRouter({
  /** List repositories the authenticated user has access to */
  listRepos: protectedProcedure.query(async ({ ctx }) => {
    // Check if account has connected GitHub OAuth
    const account = await ctx.db.account.findFirst({
      where: {
        userId: ctx.session.user.id,
        provider: "github",
      },
    });

    if (!account || !account.access_token) {
      return [];
    }

    try {
      const repos = await listUserRepos(ctx.session.user.id);
      return repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        htmlUrl: repo.html_url,
        private: repo.private,
        defaultBranch: repo.default_branch,
      }));
    } catch (error: any) {
      console.warn("Could not fetch remote GitHub repos:", error?.message || error);
      return [];
    }
  }),

  /**
   * Set up a webhook for a given repository.
   * This is typically called when linking a repository to a Service.
   */
  setupWebhook: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/github`;
      const secret = process.env.GITHUB_WEBHOOK_SECRET;

      const account = await ctx.db.account.findFirst({
        where: {
          userId: ctx.session.user.id,
          provider: "github",
        },
      });

      if (!account || !account.access_token || !secret) {
        return { success: false, skipped: true };
      }

      try {
        await createRepoWebhook(
          ctx.session.user.id,
          input.owner,
          input.repo,
          webhookUrl,
          secret
        );
        return { success: true };
      } catch (error: any) {
        console.warn(`Skipping GitHub webhook for ${input.owner}/${input.repo}:`, error?.message || error);
        return { success: false, skipped: true };
      }
    }),
});
