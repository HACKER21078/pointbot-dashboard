const DISCORD_API = "https://discord.com/api/v10";

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  position: number;
  parent_id: string | null;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
}

export async function getUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch guilds: ${res.status}`);
  }

  return res.json();
}

/** Administrator permission bit is 0x8 */
export function hasAdministrator(permissions: string): boolean {
  try {
    const perms = BigInt(permissions);
    return (perms & BigInt(0x8)) === BigInt(0x8);
  } catch {
    return false;
  }
}

export function guildIconUrl(guild: DiscordGuild, size = 64): string | null {
  if (!guild.icon) return null;
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=${size}`;
}

function botHeaders() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error("DISCORD_BOT_TOKEN is not set");
  }
  return {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  };
}

/** Fetch text + announcement channels for a guild (requires bot in server) */
export async function getGuildChannels(guildId: string): Promise<DiscordChannel[]> {
  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
    headers: botHeaders(),
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch channels (${res.status}): ${text}`);
  }

  const channels: DiscordChannel[] = await res.json();

  // Type 0 = text, 5 = announcement
  return channels
    .filter((c) => c.type === 0 || c.type === 5)
    .sort((a, b) => a.position - b.position);
}

/** Fetch roles for a guild (requires bot in server) */
export async function getGuildRoles(guildId: string): Promise<DiscordRole[]> {
  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
    headers: botHeaders(),
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch roles (${res.status}): ${text}`);
  }

  const roles: DiscordRole[] = await res.json();

  // Exclude @everyone, sort by position descending
  return roles
    .filter((r) => r.name !== "@everyone")
    .sort((a, b) => b.position - a.position);
}
