import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Project } from "@/types";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || !session.userId) {
      return NextResponse.json({ projects: [] });
    }
    const projects = await db.getProjects(session.userId);
    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to create or edit projects." },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const project: Project = {
      id: body.id || "proj-" + Date.now(),
      userId: session.userId,
      name: body.name.trim(),
      description: body.description || "",
      customInstructions: body.customInstructions || "",
      createdAt: new Date().toISOString(),
    };

    await db.saveProject(project, session.userId);
    return NextResponse.json({ project });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
