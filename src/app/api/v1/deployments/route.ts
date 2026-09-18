import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateBearerToken, checkScope } from "@/lib/api/auth-token";
import { executeDeployment } from "@/lib/orchestrator/engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await validateBearerToken(req.headers.get("authorization"));
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json({ error: "Missing query parameter 'serviceId'" }, { status: 400 });
    }

    const service = await db.service.findFirst({
      where: {
        id: serviceId,
        environment: { project: { workspaceId: auth.workspaceId } },
      },
      include: {
        deployments: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { build: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({
      serviceId: service.id,
      deployments: service.deployments.map((d) => ({
        id: d.id,
        status: d.status,
        commitSha: d.build.commitSha,
        commitMessage: d.build.commitMessage,
        createdAt: d.createdAt,
        completedAt: d.completedAt,
        buildDurationMs: d.buildDurationMs,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message.includes("token") ? 401 : 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await validateBearerToken(req.headers.get("authorization"));
    if (!checkScope(auth.scope, "DEPLOY_ONLY") && !checkScope(auth.scope, "FULL_ACCESS")) {
      return NextResponse.json({ error: "Token scope insufficient: Requires DEPLOY_ONLY or FULL_ACCESS" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.serviceId) {
      return NextResponse.json({ error: "Field 'serviceId' is required" }, { status: 400 });
    }

    const service = await db.service.findFirst({
      where: {
        id: body.serviceId,
        environment: { project: { workspaceId: auth.workspaceId } },
      },
      include: { environment: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found in workspace" }, { status: 404 });
    }

    const commitSha = body.commitSha || Math.random().toString(16).slice(2, 9);
    const commitMessage = body.commitMessage || "CLI trigger deployment";

    const build = await db.build.create({
      data: {
        serviceId: service.id,
        commitSha,
        commitMessage,
        triggeredBy: auth.userId || `token:${auth.tokenName}`,
        status: "QUEUED",
      },
    });

    const deployment = await db.deployment.create({
      data: {
        serviceId: service.id,
        buildId: build.id,
        triggeredBy: auth.userId || `token:${auth.tokenName}`,
        status: "QUEUED",
      },
    });

    // Run execution asynchronously in background
    executeDeployment(deployment.id, build.id, service.id, {
      serviceId: service.id,
      commitSha,
      commitMessage,
      userId: auth.userId || undefined,
    }).catch(() => null);

    return NextResponse.json(
      {
        deploymentId: deployment.id,
        buildId: build.id,
        status: "QUEUED",
        serviceName: service.name,
        logsUrl: `/api/deployments/${deployment.id}/logs/stream`,
        message: "Deployment queued successfully on Syncbay edge pipeline",
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message.includes("token") ? 401 : 400 });
  }
}
