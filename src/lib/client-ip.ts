/**
 * Returns the caller's IP address for rate limits and audit logs.
 *
 * x-forwarded-for is a comma-separated list in which each proxy appends the address it received
 * the request from. A client can put anything at the front of the list, but the last entry is
 * written by the proxy in front of the app, so only the last entry is trusted. This assumes a
 * single trusted proxy (the hosting platform's edge). Returns "unknown" if no address is present.
 */
export function getClientIp(req: { headers: Headers }): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const entries = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    const last = entries[entries.length - 1];
    if (last) return last;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}
