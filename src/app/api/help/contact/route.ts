import { NextRequest, NextResponse } from "next/server";
import { sendStaffContactEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, max) : "";
}

const ALLOWED_CATEGORIES = [
  "General Support",
  "Bug Report / Edge Case",
  "Billing & Subscriptions",
  "Enterprise & Quota",
  "Product Feedback",
  "Security & Privacy",
];

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  // Honeypot check for bots
  if (body?.website_hp || body?.phone_hp) {
    return NextResponse.json({ success: true, ref: "RF-BOT-FILTERED" });
  }

  const name = clean(body?.name, 100);
  const email = clean(body?.email, 150).toLowerCase();
  const categoryRaw = clean(body?.category, 60);
  const subject = clean(body?.subject, 200);
  const message = clean(body?.message, 15000);

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  const category = ALLOWED_CATEGORIES.includes(categoryRaw) ? categoryRaw : "General Support";

  if (!subject || subject.length < 3) {
    return NextResponse.json({ error: "Please provide a subject line." }, { status: 400 });
  }

  if (!message || message.length < 10) {
    return NextResponse.json({ error: "Please provide a message with at least 10 characters." }, { status: 400 });
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  const ref = `RF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const sendResult = await sendStaffContactEmail({
    name,
    email,
    category,
    subject,
    message,
    ipAddress,
    ticketId: ref,
  });

  if (!sendResult.success) {
    console.error("Staff contact email delivery error:", sendResult.error);
    return NextResponse.json(
      { error: "Could not deliver your message right now. Please try emailing staff@roleflow.site directly." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    ref,
    message: "Your message has been sent to staff@roleflow.site. We will reply directly to your email.",
  });
}
