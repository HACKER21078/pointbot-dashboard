import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getUserGuilds, hasAdministrator } from "@/lib/discord";
import { getGuildStats, getRecentLogs } from "@/lib/guild";

async function assertAdmin(guildId: string, accessToken: string) {
  const guilds = await getUserGuilds(accessToken);
  const guild = guilds.find((g) => g.id === guildId);
  return !!(guild && (hasAdministrator(guild.permissions) || guild.owner));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { guildId } = await params;
  if (!(await assertAdmin(guildId, session.accessToken))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [stats, logs] = await Promise.all([
      getGuildStats(guildId),
      getRecentLogs(guildId, 15),
    ]);
    return NextResponse.json({ ...stats, recentLogs: logs });
  } catch (err: any) {
    console.error("Stats error:", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
