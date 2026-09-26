import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/trpc";
import {
  getWeeklyVersionDrops,
  getTrendingStacks,
  getStrategicInsights,
  getFeatureVotes,
  voteForFeature,
} from "@/lib/rd/trending-engine";

export const rdRouter = createTRPCRouter({
  /**
   * Get weekly version updates and changelogs (v1.0 to v1.5)
   */
  getWeeklyDrops: publicProcedure.query(async () => {
    return getWeeklyVersionDrops();
  }),

  /**
   * Get trending developer stacks & templates (Next.js 16, Python FastAPI, Rust Axum, Go Gin, etc.)
   */
  getTrendingStacks: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getTrendingStacks(input?.category);
    }),

  /**
   * Get R&D strategic insights and market differentiators
   */
  getStrategicInsights: publicProcedure.query(async () => {
    return getStrategicInsights();
  }),

  /**
   * Community & Enterprise feature vote leaderboard
   */
  getFeatureVotes: publicProcedure.query(async () => {
    return getFeatureVotes();
  }),

  /**
   * Vote for an upcoming feature in the weekly R&D pipeline (publicly accessible on /roadmap)
   */
  voteFeature: publicProcedure
    .input(z.object({ feature: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return voteForFeature(input.feature);
    }),
});
