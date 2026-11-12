import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Project } from "@/types";

export async function GET() {
  try {
    const projects = await db.getProjects();
    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const project: Project = {
      id: "proj-" + Date.now(),
      name: body.name.trim(),
      description: body.description || "",
      customInstructions: body.customInstructions || "",
      createdAt: new Date().toISOString(),
    };

    await db.saveProject(project);
    return NextResponse.json({ project });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
