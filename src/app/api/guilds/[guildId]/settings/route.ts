import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getUserGuilds, hasAdministrator } from "@/lib/discord";
import { getGuildSettings, updateGuildSettings } from "@/lib/guild";
import { z } from "zod";

async function assertAdmin(guildId: string, accessToken: string) {
  const guilds = await getUserGuilds(accessToken);
  const guild = guilds.find((g) => g.id === guildId);
  if (!guild || (!hasAdministrator(guild.permissions) && !guild.owner)) {
    return false;
  }
  return true;
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
    const settings = await getGuildSettings(guildId);
    // Never send full API key to client
    const safe = {
      ...settings,
      roblox_api_key: settings.roblox_api_key
        ? `${settings.roblox_api_key.slice(0, 6)}…${settings.roblox_api_key.slice(-4)}`
        : null,
      has_roblox_key: !!settings.roblox_api_key,
    };
    return NextResponse.json(safe);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

const updateSchema = z.object({
  daily_points: z.number().min(0).optional(),
  daily_cooldown_hours: z.number().min(0).optional(),
  default_event_points: z.number().min(0).optional(),
  roblox_api_key: z.string().nullable().optional(),
  roblox_group_id: z.number().int().positive().nullable().optional(),
  join_request_channel_id: z.string().nullable().optional(),
});

export async function PATCH(
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
    const data = updateSchema.parse(body);

    // Clean API key if provided
    if (data.roblox_api_key) {
      data.roblox_api_key = data.roblox_api_key.replace(/\s/g, "");
      if (data.roblox_api_key.length < 20) {
        return NextResponse.json(
          { error: "API key looks too short" },
          { status: 400 }
        );
      }
    }

    await updateGuildSettings(guildId, data);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
