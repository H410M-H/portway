import { NextRequest, NextResponse } from "next/server";
import { executeSmartCrons } from "@/lib/crons/smart-crons";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handleCronExecution(req);
}

export async function POST(req: NextRequest) {
  return handleCronExecution(req);
}

async function handleCronExecution(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const cronSecret = process.env.CRON_SECRET || "syncbay-secret-cron-token";

  // Enforce authentication:
  // 1. In production or when CRON_SECRET is set, require valid Bearer token or Vercel cron header.
  // 2. In development, reject explicitly invalid Bearer tokens to prevent spoofing.
  const requiresStrictAuth = process.env.NODE_ENV === "production" || !!process.env.CRON_SECRET;
  const isAuthorized = isVercelCron || authHeader === `Bearer ${cronSecret}`;

  if (requiresStrictAuth ? !isAuthorized : (authHeader && authHeader !== `Bearer ${cronSecret}`)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET authorization token" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const categoryParam = searchParams.get("category")?.toUpperCase();
  const validCategory =
    categoryParam === "ACQUISITION" ||
    categoryParam === "MAINTENANCE" ||
    categoryParam === "SECURITY"
      ? (categoryParam as any)
      : "ALL";

  try {
    const report = await executeSmartCrons(validCategory);
    return NextResponse.json({
      status: "SUCCESS",
      triggeredBy: req.headers.get("user-agent") || "syncbay-cron-system",
      ...report,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "FAILED",
        error: err.message || "Failed to execute smart crons",
      },
      { status: 500 }
    );
  }
}
