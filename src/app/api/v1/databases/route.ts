import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateBearerToken, checkScope } from "@/lib/api/auth-token";
import { databaseProvider } from "@/lib/database-provider";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await validateBearerToken(req.headers.get("authorization"));

    const databases = await db.databaseInstance.findMany({
      where: {
        environment: { project: { workspaceId: auth.workspaceId } },
      },
      include: {
        environment: { select: { name: true, project: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      databases: databases.map((d) => ({
        id: d.id,
        name: d.name,
        provider: d.provider,
        region: d.region,
        project: d.environment.project.name,
        environment: d.environment.name,
        storageGb: d.storageGb,
        createdAt: d.createdAt,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message.includes("token") ? 401 : 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await validateBearerToken(req.headers.get("authorization"));
    if (!checkScope(auth.scope, "FULL_ACCESS")) {
      return NextResponse.json({ error: "Token scope insufficient: Requires FULL_ACCESS" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.name || !body.projectId) {
      return NextResponse.json({ error: "Fields 'name' and 'projectId' are required" }, { status: 400 });
    }

    const project = await db.project.findFirst({
      where: { id: body.projectId, workspaceId: auth.workspaceId },
      include: { environments: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const targetEnv =
      project.environments.find((e) => e.name === (body.environment || "production")) ||
      project.environments[0];

    const provider = (body.provider || "POSTGRES").toUpperCase() as "POSTGRES" | "REDIS" | "MYSQL";
    const creds = await databaseProvider.provision({
      projectId: project.id,
      environmentId: targetEnv.id,
      name: body.name.trim(),
      provider,
      region: body.region || "us-east-1",
    });

    const instance = await db.databaseInstance.create({
      data: {
        environmentId: targetEnv.id,
        name: body.name.trim(),
        provider,
        partnerDbId: creds.partnerDbId,
        connectionUrl: creds.connectionUrl,
        region: body.region || "us-east-1",
        storageGb: body.storageGb ? parseInt(body.storageGb, 10) : 1,
      },
    });

    return NextResponse.json(
      {
        id: instance.id,
        name: instance.name,
        provider: instance.provider,
        region: instance.region,
        connectionUrl: creds.connectionUrl,
        cliCommand: creds.cliCommand,
        createdAt: instance.createdAt,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message.includes("token") ? 401 : 400 });
  }
}
