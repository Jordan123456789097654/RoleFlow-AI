import { NextRequest, NextResponse } from "next/server";
import { db, ADMIN_EMAIL } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { generateIncidentDossier } from "@/lib/moderation";

export const dynamic = "force-dynamic";

async function verifyAdminAuth(req: NextRequest): Promise<boolean> {
  const session = getSessionFromRequest(req);
  return Boolean(session && session.isAdmin);
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Administrative credentials required to access legal dossiers." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const logId = searchParams.get("logId");
    const format = searchParams.get("format");

    if (!logId) {
      return NextResponse.json(
        { error: "Missing required parameter: logId" },
        { status: 400 }
      );
    }

    const logEntry = await db.getModerationLogById(logId);
    if (!logEntry) {
      return NextResponse.json(
        { error: `Incident record not found: ${logId}` },
        { status: 404 }
      );
    }

    const dossierText = generateIncidentDossier(logEntry);

    if (format === "json") {
      return NextResponse.json({
        success: true,
        logId,
        log: logEntry,
        dossier: dossierText,
      });
    }

    return new NextResponse(dossierText, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="RoleFlow-Incident-Dossier-${logId}.txt"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("Dossier generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate legal incident dossier" },
      { status: 500 }
    );
  }
}
