"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "~/home" },
  { href: "/badges", label: "~/badges" },
  { href: "/leaderboard", label: "~/leaderboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === "admin";
  const allItems = [
    ...NAV_ITEMS,
...(session?.user?.uid ? [{ href: `/profile/${session.user.uid}`, label: "~/profile" }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "~/admin", admin: true }] : []),
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-border"
      style={{ background: "rgba(10,14,10,0.92)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🐧</span>
          <span className="font-mono font-bold text-accent text-sm">Linux Badger</span>
          <span className="font-mono text-text-muted text-xs hidden sm:block">.sh</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {allItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`font-mono text-xs px-3 py-1.5 rounded-md transition-all
                ${pathname === item.href
                  ? "bg-accent/10 border border-border text-accent"
                  : (item as any).admin
                    ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/5"
                    : "text-text-dim hover:text-text-base hover:bg-white/5"
                }`}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3 shrink-0">
          {session ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                {session.user.image && (
                  <Image src={session.user.image} alt="avatar" width={28} height={28}
                    className="rounded-full border border-border" />
                )}
                <span className="font-mono text-xs text-text-dim truncate max-w-[120px]">
                  {session.user.name?.split(" ")[0]}
                </span>
              </div>
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="font-mono text-xs text-text-muted hover:text-red-400 transition-colors border border-border px-3 py-1.5 rounded-md hover:border-red-400/30">
                logout
              </button>
            </>
          ) : (
            <Link href="/login"
              className="font-mono text-xs bg-accent text-bg font-bold px-4 py-1.5 rounded-md hover:bg-accent-dim transition-colors">
              $ login
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button className="md:hidden text-text-dim" onClick={() => setMenuOpen(o => !o)}>
            <span className="font-mono text-lg">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-3 flex flex-col gap-1">
          {allItems.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
              className={`font-mono text-sm px-3 py-2 rounded-md ${
                pathname === item.href ? "text-accent bg-accent/10" : "text-text-dim"
              }`}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
