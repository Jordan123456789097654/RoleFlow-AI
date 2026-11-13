import { NextRequest, NextResponse } from "next/server";
import { createLawRequest, validateLawRequest } from "@/lib/law-enforcement";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** A reasonable ceiling for real agencies. Bulk or automated submissions are rejected. */
const LAW_REQUEST_RULE = { windowMs: 60 * 60 * 1000, max: 5 };

/** Public endpoint for the /law-enforcement form. Every request is reviewed manually. */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const limit = checkRateLimit(`law-request:${ip}`, LAW_REQUEST_RULE);
  if (limit.limited) {
    return NextResponse.json(
      { error: "Too many requests from this network. Try again later or email support@roleflow.site." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let raw: any;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const parsed = validateLawRequest(raw);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const record = await createLawRequest(parsed.value);
    return NextResponse.json({ reference: record.reference, emergency: record.emergency });
  } catch (error) {
    console.error("Law request error:", error);
    return NextResponse.json({ error: "We could not record your request. Please try again or email support@roleflow.site." }, { status: 500 });
  }
}
