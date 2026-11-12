import { NextRequest, NextResponse } from "next/server";
import { db, ADMIN_EMAIL } from "@/lib/db";
import { generateIncidentDossier } from "@/lib/moderation";

export const dynamic = "force-dynamic";

async function verifyAdminAuth(req: NextRequest): Promise<boolean> {
  const userId = req.headers.get("x-user-id");
  const userEmail = req.headers.get("x-user-email");

  if (userEmail && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  if (userId) {
    const u = await db.getUserById(userId);
    if (u && (u.isAdmin || u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
      return true;
    }
  }

  const cookie = req.cookies.get("roleflow_user");
  if (cookie?.value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookie.value));
      if (
        parsed.isAdmin ||
        parsed.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      ) {
        return true;
      }
    } catch {}
  }

  return false;
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
