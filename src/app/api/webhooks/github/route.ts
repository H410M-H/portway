import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { executeDeployment } from "@/lib/orchestrator/engine";
import { handlePullRequestWebhook } from "@/lib/orchestrator/pr-manager";

// You will need to add GITHUB_WEBHOOK_SECRET to your .env.local
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!WEBHOOK_SECRET) {
    console.warn("GITHUB_WEBHOOK_SECRET is not set in environment.");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const signature = req.headers.get("x-hub-signature-256");
  const eventName = req.headers.get("x-github-event");
  const id = req.headers.get("x-github-delivery");

  if (!signature || !eventName || !id) {
    return NextResponse.json({ error: "Missing GitHub headers" }, { status: 400 });
  }

  const payloadText = await req.text();

  // Verify HMAC signature
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(payloadText).digest("hex");

  if (signature !== digest) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(payloadText);
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Handle push event
  if (eventName === "push") {
    const rawRepoUrl = payload.repository.html_url || ""; // e.g., https://github.com/H410M-H/syncbay
    const normalizedRepoUrl = rawRepoUrl.replace(/\/$/, "").replace(/\.git$/, "");
    const branchRef = payload.ref; // e.g., refs/heads/main
    const branch = branchRef.replace("refs/heads/", "");
    const commitSha = payload.after;
    const commitMessage = payload.head_commit?.message?.split("\n")[0] || "Update from GitHub";

    // Find services linked to this repo and branch (robust to .git and trailing slash variants)
    const services = await db.service.findMany({
      where: {
        OR: [
          { repoUrl: normalizedRepoUrl },
          { repoUrl: `${normalizedRepoUrl}.git` },
          { repoUrl: `${normalizedRepoUrl}/` },
          { repoUrl: rawRepoUrl },
        ],
        branch: branch,
        sourceType: "github",
        isPaused: false,
        deletedAt: null,
      },
    });

    if (services.length === 0) {
      return NextResponse.json({ message: "No services linked to this repository/branch." }, { status: 200 });
    }

    // For each matching service, trigger a build
    const results = [];
    for (const service of services) {
      // Create a Build record
      const build = await db.build.create({
        data: {
          serviceId: service.id,
          commitSha: commitSha,
          commitMessage: commitMessage,
          triggeredBy: "github-webhook",
          status: "QUEUED",
        },
      });

      // Create a Deployment record
      const deployment = await db.deployment.create({
        data: {
          serviceId: service.id,
          buildId: build.id,
          triggeredBy: "github-webhook",
          status: "QUEUED",
        },
      });

      // Execute asynchronously via dual-driver orchestrator
      executeDeployment(deployment.id, build.id, service.id, {
        serviceId: service.id,
        commitSha,
        commitMessage,
      }).catch((e) => console.error("Webhook deployment error:", e));

      results.push({ serviceId: service.id, buildId: build.id, deploymentId: deployment.id });
    }

    return NextResponse.json({ message: "Push received, builds triggered", data: results }, { status: 202 });
  }

  // Handle pull_request event for ephemeral preview environments (F20)
  if (eventName === "pull_request") {
    const result = await handlePullRequestWebhook(payload);
    return NextResponse.json({ message: "Pull request processed", data: result }, { status: 200 });
  }

  if (eventName === "ping") {
    return NextResponse.json({ message: "pong" }, { status: 200 });
  }

  return NextResponse.json({ message: `Ignored event: ${eventName}` }, { status: 200 });
}
