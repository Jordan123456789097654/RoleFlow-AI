import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Internal document. Served only to signed-in admins, never through a public route or static asset.
const DIR = path.join(process.cwd(), "src", "content", "admin");
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden: Administrative privileges required." }, { status: 403 });
  }

  const wantsDocx = new URL(req.url).searchParams.get("format") === "docx";
  const headers = { "Cache-Control": "no-store" };

  try {
    if (wantsDocx) {
      const file = fs.readFileSync(path.join(DIR, "moderation-handbook.docx"));
      return new NextResponse(new Uint8Array(file), {
        headers: {
          ...headers,
          "Content-Type": DOCX_TYPE,
          "Content-Disposition": 'attachment; filename="RoleFlow-Moderation-Handbook.docx"',
        },
      });
    }
    const markdown = fs.readFileSync(path.join(DIR, "moderation-handbook.md"), "utf8");
    return NextResponse.json({ markdown }, { headers });
  } catch (error: any) {
    console.error("Handbook read error:", error);
    return NextResponse.json({ error: "The handbook could not be loaded." }, { status: 500 });
  }
}
