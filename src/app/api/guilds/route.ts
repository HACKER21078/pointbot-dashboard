import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getUserGuilds, hasAdministrator, guildIconUrl } from "@/lib/discord";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const guilds = await getUserGuilds(session.accessToken);
    const adminGuilds = guilds
      .filter((g) => hasAdministrator(g.permissions) || g.owner)
      .map((g) => ({
        id: g.id,
        name: g.name,
        icon: guildIconUrl(g),
        owner: g.owner,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(adminGuilds);
  } catch (err: any) {
    console.error("Failed to fetch guilds:", err);
    return NextResponse.json(
      { error: "Failed to fetch servers" },
      { status: 500 }
    );
  }
}
