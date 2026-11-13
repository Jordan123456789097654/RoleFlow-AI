import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { isEmailIcon } from "@/lib/email-icons";
import { findUnknownPlaceholders } from "@/lib/email-template-html";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Administrative privileges required." }, { status: 403 });
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, max) : "";
}

function isHttpOrPlaceholder(url: string): boolean {
  return url.includes("{{") || /^(https:\/\/|mailto:)/i.test(url);
}

/** Admin only. Lists the templates saved from the composer. */
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) return unauthorized();
  try {
    const templates = await db.listEmailTemplates();
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error("Email template list error:", error);
    return NextResponse.json({ error: error?.message || "Failed to load templates." }, { status: 500 });
  }
}

/**
 * Admin only. Creates or updates a saved template.
 * Body: { id?, title, subject, body, icon, ctaText?, ctaUrl? }. Omit id to create.
 */
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin || !session.email) return unauthorized();

  let raw: any;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const title = clean(raw?.title, 120);
  const subject = clean(raw?.subject, 200);
  const body = clean(raw?.body, 20000);
  const ctaText = clean(raw?.ctaText, 80);
  const ctaUrl = clean(raw?.ctaUrl, 2000);
  const icon = typeof raw?.icon === "string" ? raw.icon : "";

  if (!title) return NextResponse.json({ error: "Give the template a name." }, { status: 400 });
  if (!subject) return NextResponse.json({ error: "A subject is required." }, { status: 400 });
  if (body.length < 10) return NextResponse.json({ error: "The body is too short." }, { status: 400 });
  if (!isEmailIcon(icon)) return NextResponse.json({ error: "Choose an icon from the list." }, { status: 400 });
  if (ctaUrl && !isHttpOrPlaceholder(ctaUrl)) {
    return NextResponse.json({ error: "Button URL must start with https:// (or mailto:) or be a placeholder." }, { status: 400 });
  }
  const unknown = findUnknownPlaceholders(`${subject} ${body} ${ctaUrl}`);
  if (unknown.length > 0) {
    return NextResponse.json({ error: `Unknown placeholder: {{${unknown[0]}}}.` }, { status: 400 });
  }

  const requestedId = typeof raw?.id === "string" ? raw.id : "";
  if (requestedId && !/^custom-[a-z0-9-]{4,80}$/.test(requestedId)) {
    return NextResponse.json({ error: "Invalid template id." }, { status: 400 });
  }
  const now = new Date().toISOString();
  const id = requestedId || `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const saved = await db.upsertEmailTemplate({
      id,
      title,
      subject,
      body,
      icon,
      ctaText: ctaText || undefined,
      ctaUrl: ctaUrl || undefined,
      createdBy: session.email,
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ success: true, template: saved });
  } catch (error: any) {
    console.error("Email template save error:", error);
    return NextResponse.json({ error: error?.message || "Failed to save template." }, { status: 500 });
  }
}

/** Admin only. Deletes a saved template: DELETE /api/admin/emails/templates?id=custom-... */
export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) return unauthorized();
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!/^custom-[a-z0-9-]{4,80}$/.test(id)) {
    return NextResponse.json({ error: "Invalid template id." }, { status: 400 });
  }
  try {
    const deleted = await db.deleteEmailTemplate(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error("Email template delete error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete template." }, { status: 500 });
  }
}
