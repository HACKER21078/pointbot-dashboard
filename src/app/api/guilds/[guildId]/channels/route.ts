import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getUserGuilds, hasAdministrator, getGuildChannels } from "@/lib/discord";

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
    const channels = await getGuildChannels(guildId);
    return NextResponse.json(channels);
  } catch (err: any) {
    console.error("Channels error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch channels. Is the bot in this server?" },
      { status: 500 }
    );
  }
}
