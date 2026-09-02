import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getUserGuilds, hasAdministrator } from "@/lib/discord";
import { getGuildSettings, updateGuildSettings, RankRole } from "@/lib/guild";
import { z } from "zod";

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

  const settings = await getGuildSettings(guildId);
  return NextResponse.json(settings.rank_roles);
}

const rankSchema = z.object({
  ranks: z.array(
    z.object({
      minPoints: z.number().min(0),
      name: z.string().min(1).max(100),
      prefix: z.string().max(30).nullable(),
    })
  ),
});

export async function PUT(
  req: NextRequest,
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
    const body = await req.json();
    const { ranks } = rankSchema.parse(body);

    // Sort by points
    ranks.sort((a, b) => a.minPoints - b.minPoints);

    await updateGuildSettings(guildId, { rank_roles: ranks as RankRole[] });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to update ranks" }, { status: 500 });
  }
}
