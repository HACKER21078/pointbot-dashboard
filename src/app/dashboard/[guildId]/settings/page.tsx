"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const { guildId } = useParams() as { guildId: string };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    daily_points: 10,
    daily_cooldown_hours: 20,
    default_event_points: 5,
  });

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (data.daily_points !== undefined) {
          setForm({
            daily_points: data.daily_points,
            daily_cooldown_hours: data.daily_cooldown_hours,
            default_event_points: data.default_event_points,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [guildId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/guilds/${guildId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setMessage("Settings saved successfully");
      else {
        const err = await res.json();
        setMessage(err.error || "Failed to save");
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

      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <p className="mt-1 text-gray-500">Daily system and event defaults</p>

      <form onSubmit={save} className="mt-8 max-w-md space-y-6">
        <div className="card space-y-5">
          <div>
            <label className="label">Daily Points</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={form.daily_points}
              onChange={(e) =>
                setForm({ ...form, daily_points: Number(e.target.value) })
              }
              className="input"
            />
          </div>

          <div>
            <label className="label">Daily Cooldown (hours)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={form.daily_cooldown_hours}
              onChange={(e) =>
                setForm({
                  ...form,
                  daily_cooldown_hours: Number(e.target.value),
                })
              }
              className="input"
            />
          </div>

          <div>
            <label className="label">Default Event Points</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={form.default_event_points}
              onChange={(e) =>
                setForm({
                  ...form,
                  default_event_points: Number(e.target.value),
                })
              }
              className="input"
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save Changes"}
        </button>

        {message && (
          <p
            className={`text-sm ${
              message.includes("success") ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
