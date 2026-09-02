"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface PointEntry {
  user_id: string;
  points: number;
}

export default function PointsPage() {
  const { guildId } = useParams() as { guildId: string };
  const [entries, setEntries] = useState<PointEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState(10);
  const [reason, setReason] = useState("Dashboard adjustment");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/guilds/${guildId}/points`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEntries(data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [guildId]);

  async function adjust(delta: number) {
    if (!userId.trim()) {
      setMessage("Enter a Discord User ID");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/guilds/${guildId}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          amount: delta,
          reason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Updated. New total: ${data.newTotal}`);
        load();
      } else {
        setMessage(data.error || "Failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href={`/dashboard/${guildId}`}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Back
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white">Points</h1>
      <p className="mt-1 text-gray-400">Leaderboard and manual adjustments</p>

      {/* Adjust form */}
      <div className="mt-8 max-w-xl rounded-xl border border-gray-800 bg-discord-dark p-5">
        <h2 className="mb-4 font-semibold text-white">Adjust Points</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Discord User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="rounded-lg border border-gray-700 bg-discord-darker px-3 py-2 text-white"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="rounded-lg border border-gray-700 bg-discord-darker px-3 py-2 text-white"
          />
          <input
            type="text"
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="sm:col-span-2 rounded-lg border border-gray-700 bg-discord-darker px-3 py-2 text-white"
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            disabled={busy}
            onClick={() => adjust(amount)}
            className="rounded-lg bg-green-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
          >
            Add
          </button>
          <button
            disabled={busy}
            onClick={() => adjust(-amount)}
            className="rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
        {message && (
          <p className="mt-3 text-sm text-gray-300">{message}</p>
        )}
      </div>

      {/* Leaderboard */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Leaderboard (Top 100)
        </h2>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-discord-blurple border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-gray-500">No points data yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-discord-dark text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">User ID</th>
                  <th className="px-4 py-3 font-medium text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr
                    key={e.user_id}
                    className="border-t border-gray-800 hover:bg-white/5"
                  >
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-gray-300">
                      {e.user_id}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-white">
                      {Number(e.points).toLocaleString(undefined, {
                        maximumFractionDigits: 1,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
