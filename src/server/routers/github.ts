import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { listUserRepos, createRepoWebhook } from "@/lib/github";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";

export const githubRouter = createTRPCRouter({
  /** List repositories the authenticated user has access to */
  listRepos: protectedProcedure.query(async ({ ctx }) => {
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
      console.error("Failed to list GitHub repos:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch repositories from GitHub",
      });
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
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`;
      const secret = process.env.GITHUB_WEBHOOK_SECRET;

      if (!secret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server is missing GITHUB_WEBHOOK_SECRET",
        });
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
        console.error(`Failed to setup webhook for ${input.owner}/${input.repo}:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to configure GitHub webhook",
        });
      }
    }),
});
