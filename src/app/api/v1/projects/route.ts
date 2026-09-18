import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateBearerToken, checkScope } from "@/lib/api/auth-token";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await validateBearerToken(req.headers.get("authorization"));

    const projects = await db.project.findMany({
      where: {
        workspaceId: auth.workspaceId,
        deletedAt: null,
      },
      include: {
        environments: {
          include: {
            services: {
              select: { id: true, name: true, sourceType: true, instanceType: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      workspace: { id: auth.workspaceId, name: auth.workspaceName },
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        tags: p.tags,
        servicesCount: p.environments.flatMap((e) => e.services).length,
        createdAt: p.createdAt,
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
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Field 'name' is required" }, { status: 400 });
    }

    const project = await db.project.create({
      data: {
        workspaceId: auth.workspaceId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        tags: Array.isArray(body.tags) ? body.tags : [],
        environments: {
          create: [
            { name: "production", isDefault: true },
            { name: "preview", isDefault: false },
          ],
        },
      },
      include: { environments: true },
    });

    return NextResponse.json(
      {
        id: project.id,
        name: project.name,
        description: project.description,
        environments: project.environments.map((e) => ({ id: e.id, name: e.name })),
        createdAt: project.createdAt,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message.includes("token") ? 401 : 400 });
  }
}
