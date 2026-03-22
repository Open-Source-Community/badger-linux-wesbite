import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, SectionLabel, Avatar, StatusPill } from "@/components/ui";

async function getAdminStats() {
  const [usersSnap, badgesSnap, pendingSnap, approvedSnap, seasonsSnap] = await Promise.all([
    adminDb.collection("users").get(),
    adminDb.collection("badges").get(),
    adminDb.collection("badgeRequests").where("status", "==", "pending").get(),
    adminDb.collection("badgeRequests").where("status", "==", "approved").get(),
    adminDb.collection("seasons").orderBy("createdAt", "desc").get(),
  ]);

  const activeSeason = seasonsSnap.docs.find(d => d.data().isActive);

  // Recent 5 pending requests
  const recentSnap = await adminDb.collection("badgeRequests")
    .where("status", "==", "pending")
    .orderBy("createdAt", "desc")
    .limit(5)
    .get();
  const recentRequests = recentSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return {
    memberCount: usersSnap.size,
    badgeCount: badgesSnap.size,
    pendingCount: pendingSnap.size,
    approvedCount: approvedSnap.size,
    activeSeason: activeSeason ? { id: activeSeason.id, ...activeSeason.data() } : null,
    seasonCount: seasonsSnap.size,
    recentRequests,
  };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/");

  const stats = await getAdminStats();

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="font-mono text-xs text-yellow-400 tracking-widest mb-1">⚡ ADMIN PANEL</p>
          <h1 className="font-mono font-bold text-3xl text-text-base">Dashboard</h1>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/admin/seasons"
            className="font-mono text-xs px-4 py-2.5 rounded-lg border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 transition-all">
            + Manage Seasons
          </Link>
          <Link href="/admin/requests"
            className="font-mono text-xs px-4 py-2.5 rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-all">
            Review Requests {stats.pendingCount > 0 && `(${stats.pendingCount})`}
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Members", value: stats.memberCount, icon: "👥", color: "#4a9eff" },
          { label: "Badges Created", value: stats.badgeCount, icon: "🏅", color: "#39d353" },
          { label: "Pending Review", value: stats.pendingCount, icon: "⏳", color: "#f0c040" },
          { label: "Total Approved", value: stats.approvedCount, icon: "✅", color: "#39d353" },
        ].map(s => (
          <Card key={s.label} className="p-5 text-center">
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="font-mono text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="font-sans text-xs text-text-dim">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active season */}
        <div>
          <SectionLabel>Active Season</SectionLabel>
          <Card className="p-5">
            {stats.activeSeason ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-lg text-accent">{(stats.activeSeason as any).name}</p>
                  <p className="font-sans text-xs text-text-dim mt-1">{stats.badgeCount} badges · {stats.seasonCount} seasons total</p>
                </div>
                <Link href="/admin/seasons"
                  className="font-mono text-xs text-text-dim border border-border px-3 py-1.5 rounded-lg hover:border-accent/30 hover:text-accent transition-all">
                  Manage →
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="font-sans text-sm text-text-muted">No active season.</p>
                <Link href="/admin/seasons"
                  className="font-mono text-xs text-yellow-400 border border-yellow-400/30 px-3 py-1.5 rounded-lg hover:bg-yellow-400/10 transition-all">
                  Create one →
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Quick links */}
        <div>
          <SectionLabel>Quick Actions</SectionLabel>
          <div className="space-y-2">
            {[
              { href: "/admin/requests?status=pending", label: "Review pending requests", icon: "📋", count: stats.pendingCount },
              { href: "/admin/seasons", label: "Create new season", icon: "📅", count: null },
              { href: "/leaderboard", label: "View leaderboard", icon: "🏆", count: null },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <Card className="flex items-center gap-3 p-4 hover:border-accent/30 transition-all cursor-pointer">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-sans text-sm text-text-base flex-1">{item.label}</span>
                  {item.count != null && item.count > 0 && (
                    <span className="font-mono text-xs font-bold bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  )}
                  <span className="text-text-muted">→</span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent pending requests */}
      {stats.recentRequests.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Recent Pending Requests</SectionLabel>
            <Link href="/admin/requests" className="font-mono text-xs text-accent-dim hover:text-accent transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recentRequests.map((r: any) => (
              <Card key={r.id} className="flex items-center gap-4 p-4">
                <span className="text-2xl shrink-0">{r.badgeIcon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium text-text-base">{r.badgeName}</p>
                  <p className="font-sans text-xs text-text-dim truncate">{r.userName} · {r.note}</p>
                </div>
                <StatusPill status={r.status} />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
