import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { listUserRepos, createRepoWebhook } from "@/lib/github";
import { TRPCError } from "@trpc/server";

export const githubRouter = createTRPCRouter({
  /** Returns the GitHub connection status for the current user */
  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    const account = await ctx.db.account.findFirst({
      where: {
        userId: ctx.session.user.id,
        provider: "github",
      },
    });

    if (!account || !account.access_token) {
      return {
        isConnected: false,
        username: null,
        hasRepoScope: false,
      };
    }

    try {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Syncbay-ControlPlane",
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Token is revoked or expired; clear it from db so user can cleanly reconnect
          await ctx.db.account.updateMany({
            where: { userId: ctx.session.user.id, provider: "github" },
            data: { access_token: null },
          });
        }
        return {
          isConnected: false,
          username: null,
          hasRepoScope: false,
        };
      }

      const ghUser = await res.json();
      const scopes = res.headers.get("x-oauth-scopes") || account.scope || "";
      const hasRepoScope = scopes.includes("repo");

      return {
        isConnected: true,
        username: ghUser.login || null,
        name: ghUser.name || null,
        avatarUrl: ghUser.avatar_url || null,
        hasRepoScope,
      };
    } catch {
      return {
        isConnected: false,
        username: null,
        hasRepoScope: false,
      };
    }
  }),

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
      if (error?.status === 401 || error?.message?.includes("Bad credentials")) {
        // Clear invalid token in DB so user is prompted to reconnect
        await ctx.db.account.updateMany({
          where: { userId: ctx.session.user.id, provider: "github" },
          data: { access_token: null },
        });
      }
      return [];
    }
  }),

  /** Connect GitHub using a Personal Access Token (PAT) */
  connectPersonalAccessToken: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1, "Personal Access Token is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cleanToken = input.token.trim();

      // Validate token with GitHub API
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Syncbay-ControlPlane",
        },
      });

      if (!res.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid GitHub Personal Access Token or expired credentials.",
        });
      }

      const ghUser = await res.json();
      const scopes = res.headers.get("x-oauth-scopes") || "repo,read:user";
      const providerAccountId = String(ghUser.id);

      await ctx.db.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "github",
            providerAccountId,
          },
        },
        update: {
          userId: ctx.session.user.id,
          access_token: cleanToken,
          scope: scopes,
          token_type: "bearer",
        },
        create: {
          userId: ctx.session.user.id,
          type: "oauth",
          provider: "github",
          providerAccountId,
          access_token: cleanToken,
          scope: scopes,
          token_type: "bearer",
        },
      });

      // Update user's githubId
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { githubId: providerAccountId },
      });

      return {
        success: true,
        username: ghUser.login,
        avatarUrl: ghUser.avatar_url,
      };
    }),

  /** Disconnect GitHub account */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.account.updateMany({
      where: {
        userId: ctx.session.user.id,
        provider: "github",
      },
      data: {
        access_token: null,
      },
    });
    return { success: true };
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
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.syncbay.app"}/api/webhooks/github`;
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
