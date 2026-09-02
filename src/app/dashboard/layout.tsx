"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/guilds")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGuilds(data);
      })
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111214]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#5865F2] border-t-transparent" />
      </div>
    );
  }

  const currentGuildId = pathname.split("/")[2];
  const navItems = currentGuildId
    ? [
        { href: `/dashboard/${currentGuildId}`, label: "Overview", exact: true },
        { href: `/dashboard/${currentGuildId}/settings`, label: "Settings" },
        { href: `/dashboard/${currentGuildId}/ranks`, label: "Ranks" },
        { href: `/dashboard/${currentGuildId}/points`, label: "Points" },
        { href: `/dashboard/${currentGuildId}/roblox`, label: "Roblox" },
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-[#111214]">
      <aside className="flex w-[280px] shrink-0 flex-col border-r border-white/5 bg-[#1e1f22]">
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5865F2] text-sm font-bold shadow-lg shadow-[#5865F2]/30">
            PB
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">
              PointBot
            </div>
            <div className="truncate text-xs text-gray-500">
              {session?.user?.name}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Servers
          </div>
          {guilds.length === 0 ? (
            <p className="px-2 text-sm text-gray-500">No admin servers found.</p>
          ) : (
            <ul className="space-y-0.5">
              {guilds.map((g) => {
                const active = currentGuildId === g.id;
                return (
                  <li key={g.id}>
                    <Link
                      href={`/dashboard/${g.id}`}
                      className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition ${
                        active
                          ? "bg-[#5865F2]/15 text-white"
                          : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                      }`}
                    >
                      {g.icon ? (
                        <img
                          src={g.icon}
                          alt=""
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2b2d31] text-xs font-bold text-gray-300">
                          {g.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate font-medium">{g.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {navItems.length > 0 && (
            <>
              <div className="mb-2 mt-6 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Manage
              </div>
              <ul className="space-y-0.5">
                {navItems.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block rounded-lg px-3 py-2 text-sm transition ${
                          active
                            ? "bg-white/10 text-white"
                            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="border-t border-white/5 p-3">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 transition hover:bg-white/5 hover:text-gray-300"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
