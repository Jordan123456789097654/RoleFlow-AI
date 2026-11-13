import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import type { LawRequestStatus } from "@/types";

export const dynamic = "force-dynamic";

const ALLOWED: LawRequestStatus[] = ["in_review", "closed", "rejected"];

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: "Administrative privileges required." }, { status: 403 });
  const requests = await db.listLawRequests();
  return NextResponse.json({ requests });
}

/** Body: { id, status: "in_review" | "closed" | "rejected", reviewNote? } */
export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin || !session.email) {
    return NextResponse.json({ error: "Administrative privileges required." }, { status: 403 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  if (!ALLOWED.includes(body?.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  const note = typeof body?.reviewNote === "string" ? body.reviewNote.trim().slice(0, 2000) : undefined;
  const updated = await db.updateLawRequest(String(body?.id || ""), {
    status: body.status,
    reviewNote: note,
    reviewedBy: session.email,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  return NextResponse.json({ request: updated });
}
