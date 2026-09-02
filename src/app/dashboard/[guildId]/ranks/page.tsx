"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Rank {
  minPoints: number;
  name: string;
  prefix: string | null;
}

interface Role {
  id: string;
  name: string;
  color: number;
  position: number;
}

export default function RanksPage() {
  const { guildId } = useParams() as { guildId: string };
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [rolesError, setRolesError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/guilds/${guildId}/ranks`).then((r) => r.json()),
      fetch(`/api/guilds/${guildId}/roles`).then((r) => r.json()),
    ])
      .then(([rankData, roleData]) => {
        if (Array.isArray(rankData)) setRanks(rankData);
        if (Array.isArray(roleData)) setRoles(roleData);
        else setRolesError(roleData.error || "Could not load roles");
      })
      .finally(() => setLoading(false));
  }, [guildId]);

  function updateRank(index: number, field: keyof Rank, value: any) {
    const next = [...ranks];
    next[index] = { ...next[index], [field]: value };
    setRanks(next);
  }

  function addRank() {
    setRanks([...ranks, { minPoints: 0, name: "", prefix: null }]);
  }

  function removeRank(index: number) {
    setRanks(ranks.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const cleaned = ranks.filter((r) => r.name.trim());
      const res = await fetch(`/api/guilds/${guildId}/ranks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ranks: cleaned }),
      });
      if (res.ok) {
        setRanks(cleaned);
        setMessage("Ranks saved successfully");
      } else {
        const err = await res.json();
        setMessage(JSON.stringify(err.error) || "Failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5865F2] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href={`/dashboard/${guildId}`}
          className="text-sm text-gray-500 hover:text-white"
        >
          ← Back to overview
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ranks</h1>
          <p className="mt-1 text-gray-500">
            Point thresholds and optional nickname prefixes
          </p>
        </div>
        <button onClick={addRank} className="btn-success">
          + Add Rank
        </button>
      </div>

      {rolesError && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {rolesError} — you can still type role names manually.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {ranks.map((rank, i) => (
          <div key={i} className="card flex flex-wrap items-end gap-3 !p-4">
            <div className="w-28">
              <label className="label">Min points</label>
              <input
                type="number"
                min={0}
                value={rank.minPoints}
                onChange={(e) =>
                  updateRank(i, "minPoints", Number(e.target.value))
                }
                className="input"
              />
            </div>

            <div className="min-w-[180px] flex-1">
              <label className="label">Role name</label>
              {roles.length > 0 ? (
                <select
                  value={rank.name}
                  onChange={(e) => updateRank(i, "name", e.target.value)}
                  className="input"
                >
                  <option value="">— Select role —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                  {rank.name &&
                    !roles.some((r) => r.name === rank.name) && (
                      <option value={rank.name}>{rank.name}</option>
                    )}
                </select>
              ) : (
                <input
                  type="text"
                  value={rank.name}
                  onChange={(e) => updateRank(i, "name", e.target.value)}
                  className="input"
                  placeholder="Role name"
                />
              )}
            </div>

            <div className="w-36">
              <label className="label">Prefix</label>
              <input
                type="text"
                value={rank.prefix || ""}
                onChange={(e) =>
                  updateRank(i, "prefix", e.target.value || null)
                }
                className="input"
                placeholder="optional"
              />
            </div>

            <button onClick={() => removeRank(i)} className="btn-danger mb-0.5">
              Remove
            </button>
          </div>
        ))}

        {ranks.length === 0 && (
          <p className="text-gray-500">No ranks configured yet.</p>
        )}
      </div>

      <button onClick={save} disabled={saving} className="btn-primary mt-6">
        {saving ? "Saving…" : "Save Ranks"}
      </button>

      {message && (
        <p
          className={`mt-3 text-sm ${
            message.includes("success") ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
