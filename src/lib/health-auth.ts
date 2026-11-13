import crypto from "crypto";
import type { NextRequest } from "next/server";

/**
 * Checks `Authorization: Bearer <HEALTH_CHECK_TOKEN>`. "disabled" means no token of reasonable
 * length is configured, so the health endpoints should not exist at all.
 */
export function checkHealthToken(req: NextRequest): "ok" | "disabled" | "unauthorized" {
  const expected = process.env.HEALTH_CHECK_TOKEN || "";
  if (expected.length < 32) return "disabled";

  const header = req.headers.get("authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return "unauthorized";
  return "ok";
}
