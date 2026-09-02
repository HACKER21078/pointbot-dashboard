"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  memberCount: number;
  totalPoints: number;
  topUsers: { user_id: string; points: number }[];
  recentLogs: {
    user_id: string;
    change_amount: number;
    new_total: number;
    reason: string;
    moderator_id: string | null;
    created_at: string;
  }[];
}

const cards = [
  {
    title: "Settings",
    description: "Daily points, cooldown, event rewards",
    href: "settings",
    accent: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
  },
  {
    title: "Ranks",
    description: "Point thresholds & nickname prefixes",
    href: "ranks",
    accent: "from-purple-500/20 to-purple-600/5 border-purple-500/20",
  },
  {
    title: "Points",
    description: "Leaderboard and manual adjustments",
    href: "points",
    accent: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
  },
  {
    title: "Roblox",
    description: "API key, group & join-request channel",
    href: "roblox",
    accent: "from-orange-500/20 to-orange-600/5 border-orange-500/20",
  },
];

export default function GuildOverview() {
  const params = useParams();
  const guildId = params.guildId as string;
  const [name, setName] = useState("Server");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/guilds")
      .then((r) => r.json())
      .then((guilds) => {
        const g = guilds.find((x: any) => x.id === guildId);
        if (g) setName(g.name);
      })
      .catch(() => {});

    fetch(`/api/guilds/${guildId}/stats`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setStats(data);
      })
      .catch(() => {});
  }, [guildId]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{name}</h1>
        <p className="mt-1 text-gray-500">Server overview & quick actions</p>
      </div>

      {stats && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="card">
            <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Members with points
            </div>
            <div className="mt-2 text-3xl font-bold text-white">
              {stats.memberCount.toLocaleString()}
            </div>
          </div>
          <div className="card">
            <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total points
            </div>
            <div className="mt-2 text-3xl font-bold text-white">
              {stats.totalPoints.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
          <div className="card">
            <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Top player
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              {stats.topUsers[0]
                ? `${Number(stats.topUsers[0].points).toLocaleString()} pts`
                : "—"}
            </div>
            {stats.topUsers[0] && (
              <div className="mt-1 font-mono text-xs text-gray-500">
                {stats.topUsers[0].user_id}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={`/dashboard/${guildId}/${card.href}`}
            className={`rounded-xl border bg-gradient-to-br p-5 transition hover:scale-[1.02] hover:shadow-lg ${card.accent}`}
          >
            <div className="text-base font-semibold text-white">{card.title}</div>
            <p className="mt-1.5 text-sm text-gray-400">{card.description}</p>
          </Link>
        ))}
      </div>

      {stats && stats.recentLogs?.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Recent point activity
          </h2>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/5 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Change</th>
                  <th className="px-4 py-3 font-medium">New total</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLogs.map((log, i) => (
                  <tr
                    key={i}
                    className="border-t border-white/5 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                      {log.user_id}
                    </td>
                    <td
                      className={`px-4 py-2.5 font-medium ${
                        log.change_amount >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {log.change_amount >= 0 ? "+" : ""}
                      {log.change_amount}
                    </td>
                    <td className="px-4 py-2.5 text-white">{log.new_total}</td>
                    <td className="px-4 py-2.5 text-gray-400">{log.reason}</td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
