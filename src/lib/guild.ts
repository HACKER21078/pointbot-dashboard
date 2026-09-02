import { query, queryOne } from "./db";

export interface RankRole {
  minPoints: number;
  name: string;
  prefix: string | null;
}

export interface GuildSettings {
  guild_id: string;
  daily_points: number;
  daily_cooldown_hours: number;
  default_event_points: number;
  rank_roles: RankRole[];
  roblox_api_key: string | null;
  roblox_group_id: number | null;
  join_request_channel_id: string | null;
}

const DEFAULT_RANKS: RankRole[] = [
  { minPoints: 100, name: "Bronze", prefix: null },
  { minPoints: 250, name: "Silver", prefix: null },
  { minPoints: 500, name: "Gold", prefix: null },
  { minPoints: 1000, name: "Platinum", prefix: null },
  { minPoints: 2500, name: "Diamond", prefix: null },
];

function parseRanks(raw: any): RankRole[] {
  if (!raw) return DEFAULT_RANKS;
  let arr = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return DEFAULT_RANKS;
    }
  }
  return (arr as any[]).map((r) => ({
    minPoints: Number(r[0] ?? r.minPoints ?? 0),
    name: String(r[1] ?? r.name ?? "Unknown"),
    prefix: r[2] ?? r.prefix ?? null,
  }));
}

export async function getGuildSettings(guildId: string): Promise<GuildSettings> {
  const row = await queryOne<any>(
    "SELECT * FROM guild_settings WHERE guild_id = ?",
    [guildId]
  );

  if (!row) {
    // Create default row
    await query(
      `INSERT INTO guild_settings
       (guild_id, daily_points, daily_cooldown_hours, default_event_points, rank_roles)
       VALUES (?, 10, 20, 5, ?)`,
      [guildId, JSON.stringify(DEFAULT_RANKS.map((r) => [r.minPoints, r.name, r.prefix]))]
    );
    return {
      guild_id: guildId,
      daily_points: 10,
      daily_cooldown_hours: 20,
      default_event_points: 5,
      rank_roles: DEFAULT_RANKS,
      roblox_api_key: null,
      roblox_group_id: null,
      join_request_channel_id: null,
    };
  }

  return {
    guild_id: String(row.guild_id),
    daily_points: Number(row.daily_points),
    daily_cooldown_hours: Number(row.daily_cooldown_hours),
    default_event_points: Number(row.default_event_points),
    rank_roles: parseRanks(row.rank_roles),
    roblox_api_key: row.roblox_api_key
      ? String(row.roblox_api_key).replace(/\s/g, "")
      : null,
    roblox_group_id: row.roblox_group_id ? Number(row.roblox_group_id) : null,
    join_request_channel_id: row.join_request_channel_id
      ? String(row.join_request_channel_id)
      : null,
  };
}

export async function updateGuildSettings(
  guildId: string,
  data: Partial<{
    daily_points: number;
    daily_cooldown_hours: number;
    default_event_points: number;
    rank_roles: RankRole[];
    roblox_api_key: string | null;
    roblox_group_id: number | null;
    join_request_channel_id: string | null;
  }>
) {
  // Ensure row exists
  await getGuildSettings(guildId);

  const sets: string[] = [];
  const values: any[] = [];

  if (data.daily_points !== undefined) {
    sets.push("daily_points = ?");
    values.push(data.daily_points);
  }
  if (data.daily_cooldown_hours !== undefined) {
    sets.push("daily_cooldown_hours = ?");
    values.push(data.daily_cooldown_hours);
  }
  if (data.default_event_points !== undefined) {
    sets.push("default_event_points = ?");
    values.push(data.default_event_points);
  }
  if (data.rank_roles !== undefined) {
    sets.push("rank_roles = ?");
    values.push(
      JSON.stringify(data.rank_roles.map((r) => [r.minPoints, r.name, r.prefix]))
    );
  }
  if (data.roblox_api_key !== undefined) {
    sets.push("roblox_api_key = ?");
    values.push(data.roblox_api_key);
  }
  if (data.roblox_group_id !== undefined) {
    sets.push("roblox_group_id = ?");
    values.push(data.roblox_group_id);
  }
  if (data.join_request_channel_id !== undefined) {
    sets.push("join_request_channel_id = ?");
    values.push(data.join_request_channel_id);
  }

  if (sets.length === 0) return;

  values.push(guildId);
  await query(
    `UPDATE guild_settings SET ${sets.join(", ")} WHERE guild_id = ?`,
    values
  );
}

export async function getTopPoints(guildId: string, limit = 50) {
  return query<{ user_id: string; points: number }>(
    "SELECT user_id, points FROM points WHERE guild_id = ? ORDER BY points DESC LIMIT ?",
    [guildId, limit]
  );
}

export async function getUserPoints(guildId: string, userId: string) {
  const row = await queryOne<{ points: number }>(
    "SELECT points FROM points WHERE guild_id = ? AND user_id = ?",
    [guildId, userId]
  );
  return row ? Number(row.points) : 0;
}

export async function changePoints(
  guildId: string,
  userId: string,
  amount: number,
  reason = "Dashboard adjustment",
  moderatorId?: string
) {
  await query(
    `INSERT INTO points (guild_id, user_id, points)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE points = GREATEST(points + VALUES(points), 0)`,
    [guildId, userId, amount]
  );

  const newTotal = await getUserPoints(guildId, userId);

  await query(
    `INSERT INTO point_logs
     (guild_id, user_id, change_amount, new_total, reason, moderator_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [guildId, userId, amount, newTotal, reason, moderatorId || null]
  );

  return newTotal;
}

export async function getGuildStats(guildId: string) {
  const [countRow] = await query<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM points WHERE guild_id = ?",
    [guildId]
  );
  const [sumRow] = await query<{ total: number }>(
    "SELECT COALESCE(SUM(points), 0) as total FROM points WHERE guild_id = ?",
    [guildId]
  );
  const top = await getTopPoints(guildId, 5);

  return {
    memberCount: Number(countRow?.cnt ?? 0),
    totalPoints: Number(sumRow?.total ?? 0),
    topUsers: top,
  };
}

export async function getRecentLogs(guildId: string, limit = 20) {
  return query<{
    user_id: string;
    change_amount: number;
    new_total: number;
    reason: string;
    moderator_id: string | null;
    created_at: string;
  }>(
    `SELECT user_id, change_amount, new_total, reason, moderator_id, created_at
     FROM point_logs
     WHERE guild_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [guildId, limit]
  );
}
