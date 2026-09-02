"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Channel {
  id: string;
  name: string;
  type: number;
}

export default function RobloxPage() {
  const { guildId } = useParams() as { guildId: string };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsError, setChannelsError] = useState("");
  const [form, setForm] = useState({
    roblox_api_key: "",
    roblox_group_id: "",
    join_request_channel_id: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/guilds/${guildId}/settings`).then((r) => r.json()),
      fetch(`/api/guilds/${guildId}/channels`).then((r) => r.json()),
    ])
      .then(([settings, ch]) => {
        setHasKey(!!settings.has_roblox_key);
        setMaskedKey(settings.roblox_api_key);
        setForm({
          roblox_api_key: "",
          roblox_group_id: settings.roblox_group_id
            ? String(settings.roblox_group_id)
            : "",
          join_request_channel_id: settings.join_request_channel_id || "",
        });
        if (Array.isArray(ch)) {
          setChannels(ch);
        } else {
          setChannelsError(ch.error || "Could not load channels");
        }
      })
      .finally(() => setLoading(false));
  }, [guildId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const payload: any = {};
    if (form.roblox_api_key.trim()) {
      payload.roblox_api_key = form.roblox_api_key.trim();
    }
    payload.roblox_group_id = form.roblox_group_id.trim()
      ? Number(form.roblox_group_id)
      : null;
    payload.join_request_channel_id =
      form.join_request_channel_id.trim() || null;

    try {
      const res = await fetch(`/api/guilds/${guildId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMessage("Roblox settings saved successfully");
        if (form.roblox_api_key) {
          setHasKey(true);
          setForm((f) => ({ ...f, roblox_api_key: "" }));
        }
      } else {
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

      <h1 className="text-2xl font-bold text-white">Roblox Integration</h1>
      <p className="mt-1 text-gray-500">
        Open Cloud API key, Group ID and join-request channel
      </p>

      <form onSubmit={save} className="mt-8 max-w-lg space-y-6">
        <div className="card space-y-5">
          <div>
            <label className="label">
              API Key{" "}
              {hasKey && (
                <span className="ml-2 text-xs font-normal text-emerald-400">
                  currently set ({maskedKey})
                </span>
              )}
            </label>
            <input
              type="password"
              placeholder={
                hasKey ? "Enter new key to replace…" : "Paste Open Cloud API key"
              }
              value={form.roblox_api_key}
              onChange={(e) =>
                setForm({ ...form, roblox_api_key: e.target.value })
              }
              className="input"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Leave empty to keep the existing key. Never shown in full.
            </p>
          </div>

          <div>
            <label className="label">Group ID</label>
            <input
              type="text"
              placeholder="e.g. 12345678"
              value={form.roblox_group_id}
              onChange={(e) =>
                setForm({ ...form, roblox_group_id: e.target.value })
              }
              className="input"
            />
          </div>

          <div>
            <label className="label">Join-Request Channel</label>
            {channelsError ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                {channelsError}
                <p className="mt-1 text-xs opacity-80">
                  Set DISCORD_BOT_TOKEN on Vercel and ensure the bot is in this
                  server.
                </p>
                <input
                  type="text"
                  placeholder="Or paste channel ID manually"
                  value={form.join_request_channel_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      join_request_channel_id: e.target.value,
                    })
                  }
                  className="input mt-2"
                />
              </div>
            ) : (
              <select
                value={form.join_request_channel_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    join_request_channel_id: e.target.value,
                  })
                }
                className="input"
              >
                <option value="">— Select a channel —</option>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save Roblox Settings"}
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
