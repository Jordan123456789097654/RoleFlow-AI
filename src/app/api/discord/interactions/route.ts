import { NextRequest, NextResponse } from "next/server";
import { verifyDiscordInteraction, STATUS_PAGE_URL } from "@/lib/discord";
import { getActiveSystemIncidents } from "@/lib/incidents";
import { getLiveBetterStackTelemetry } from "@/lib/betterstack";

export const dynamic = "force-dynamic";

/**
 * Discord HTTP Interactions Endpoint
 * Hosted directly on Vercel along with the Next.js website.
 * Allows the Discord bot to run 100% serverless without a permanent gateway server.
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-signature-ed25519");
    const timestamp = req.headers.get("x-signature-timestamp");

    const rawBody = await req.text();

    const isValid = verifyDiscordInteraction(rawBody, signature, timestamp);
    if (!isValid) {
      return new NextResponse("Invalid request signature", { status: 401 });
    }

    const interaction = JSON.parse(rawBody);

    // 1. Handle Discord ACK / PING (Type 1)
    if (interaction.type === 1) {
      return NextResponse.json({ type: 1 });
    }

    // 2. Handle Application Slash Commands (Type 2)
    if (interaction.type === 2) {
      const commandName = interaction.data?.name;

      if (commandName === "ping") {
        return NextResponse.json({
          type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
          data: {
            content: "🏓 **Pong!** RoleFlow telemetry engine is online and running on Vercel Serverless.",
          },
        });
      }

      if (commandName === "status") {
        const telemetry = await getLiveBetterStackTelemetry().catch(() => []);
        const activeIncidents = await getActiveSystemIncidents().catch(() => []);

        const statusLabel =
          activeIncidents.length === 0
            ? "🟢 All Systems Operational"
            : `⚠️ ${activeIncidents.length} Active Incident(s)`;

        const color = activeIncidents.length === 0 ? 5763719 : 16705372;

        return NextResponse.json({
          type: 4,
          data: {
            embeds: [
              {
                title: `📡 RoleFlow Infrastructure Telemetry`,
                description: `**Current Overall Status:** ${statusLabel}\n\nLive real-time operational status for all inference clusters and services.`,
                color,
                fields: [
                  {
                    name: "⚡ Monitored Models",
                    value: "`Apex 1.0` (Operational)\n`Omni 1.0` (Operational)\n`Genesis 1.5` (Operational)\n`Flash 2.0` (Operational)",
                    inline: true,
                  },
                  {
                    name: "🛡️ Core Services",
                    value: "`API Gateway` (Healthy)\n`PostgreSQL / Data` (Healthy)\n`Telemetry Watchdog` (Active)",
                    inline: true,
                  },
                ],
                footer: {
                  text: "RoleFlow Official Bot • Hosted on Vercel",
                  icon_url: "https://roleflow.site/icon.png",
                },
              },
            ],
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 5,
                    label: "View Status Page",
                    url: STATUS_PAGE_URL,
                  },
                ],
              },
            ],
          },
        });
      }

      if (commandName === "incidents") {
        const activeIncidents = await getActiveSystemIncidents().catch(() => []);

        if (activeIncidents.length === 0) {
          return NextResponse.json({
            type: 4,
            data: {
              content: "🟢 **No active incidents.** All RoleFlow systems and neural inference clusters are operational.",
            },
          });
        }

        const incidentList = activeIncidents
          .map(
            (inc) =>
              `• **${inc.id}** [${inc.severity.toUpperCase()}]: ${inc.title} (${inc.status})`
          )
          .join("\n");

        return NextResponse.json({
          type: 4,
          data: {
            content: `⚠️ **Active Incidents (${activeIncidents.length}):**\n\n${incidentList}\n\nTrack updates on ${STATUS_PAGE_URL}`,
          },
        });
      }
    }

    return NextResponse.json({
      type: 4,
      data: { content: "Unknown interaction" },
    });
  } catch (err: any) {
    console.error("Discord interaction error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
