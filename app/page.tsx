export const revalidate = 60;
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import Link from "next/link";
import { Terminal, Card, Avatar, SectionLabel } from "@/components/ui";

async function getStats() {
  const [usersSnap, badgesSnap, requestsSnap, seasonsSnap] = await Promise.all([
    adminDb.collection("users").get(),
    adminDb.collection("badges").get(),
    adminDb.collection("badgeRequests").where("status", "==", "pending").get(),
    adminDb.collection("seasons").where("isActive", "==", true).limit(1).get(),
  ]);

  const activeSeason = seasonsSnap.empty ? null : { id: seasonsSnap.docs[0].id, ...seasonsSnap.docs[0].data() } as any;

  // Top 4 members by points
  const topSnap = await adminDb.collection("users").orderBy("totalPoints", "desc").limit(4).get();
  const topMembers = topSnap.docs.map(d => ({ uid: d.id, ...d.data() })) as any[];

  return {
    memberCount: usersSnap.size,
    badgeCount: badgesSnap.size,
    pendingCount: requestsSnap.size,
    activeSeason,
    topMembers,
  };
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const { memberCount, badgeCount, pendingCount, activeSeason, topMembers } = await getStats();

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="text-center py-16 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(57,211,83,0.1), transparent)" }} />

        {activeSeason && (
          <p className="font-mono text-xs text-accent-dim tracking-[3px] mb-4 uppercase">
            Season: {activeSeason.name}
          </p>
        )}

        <h1 className="font-mono font-bold text-4xl sm:text-5xl text-text-base leading-tight mb-5">
          Earn badges.<br />
          <span className="text-accent" style={{ filter: "drop-shadow(0 0 20px rgba(57,211,83,0.35))" }}>
            Prove your skills.
          </span>
        </h1>

        <p className="font-sans text-base text-text-dim max-w-md mx-auto mb-8 leading-relaxed">
          Request season badges for what you've built and contributed.
          Build your profile. Climb the leaderboard.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          {session ? (
            <>
              <Link href="/badges"
                className="font-mono text-sm font-bold bg-accent text-bg px-6 py-3 rounded-lg hover:bg-accent-dim transition-all"
                style={{ boxShadow: "0 0 20px rgba(57,211,83,0.25)" }}>
                $ request --badge
              </Link>
              <Link href={`/profile/${session.user.uid}`}
                className="font-mono text-sm text-text-base border border-border px-6 py-3 rounded-lg hover:border-accent/40 transition-all">
                $ view --profile
              </Link>
            </>
          ) : (
            <>
              <Link href="/login"
                className="font-mono text-sm font-bold bg-accent text-bg px-6 py-3 rounded-lg hover:bg-accent-dim transition-all"
                style={{ boxShadow: "0 0 20px rgba(57,211,83,0.25)" }}>
                $ login --google
              </Link>
              <Link href="/leaderboard"
                className="font-mono text-sm text-text-base border border-border px-6 py-3 rounded-lg hover:border-accent/40 transition-all">
                $ view --leaderboard
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          { label: "Members", value: memberCount, icon: "👥" },
          { label: "Badges This Season", value: badgeCount, icon: "🏅" },
          { label: "Pending Requests", value: pendingCount, icon: "⏳" },
          { label: "Active Season", value: activeSeason?.name ?? "None", icon: "📅" },
        ].map(s => (
          <Card key={s.label} className="p-5 text-center">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="font-mono text-xl font-bold text-accent mb-1">{s.value}</div>
            <div className="font-sans text-xs text-text-dim">{s.label}</div>
          </Card>
        ))}
      </section>

      {/* How it works + Leaderboard preview */}
      <section className="grid md:grid-cols-2 gap-6 mb-12">
        <div>
          <SectionLabel>How it works</SectionLabel>
          <Terminal lines={[
            "$ badge-system --help",
            "",
            "# 1. Browse this season's badges",
            "$ ls /badges/active-season/",
            "",
            "# 2. Submit a request with proof",
            "$ badge request --name 'Kernel Hacker'",
            "    --proof 'github.com/you/repo'",
            "",
            "# 3. Admins review & approve",
            "# 4. Badge appears on your profile!",
            "$ profile --show me",
          ]} />
        </div>

        <div>
          <SectionLabel>Top members</SectionLabel>
          <div className="space-y-2">
            {topMembers.length === 0 && (
              <p className="font-mono text-sm text-text-muted text-center py-8">No members yet.</p>
            )}
            {topMembers.map((m, i) => (
              <Link key={m.uid} href={`/profile/${m.uid}`}>
                <Card className="flex items-center gap-3 p-3 hover:border-accent/30 transition-all cursor-pointer">
                  <span className="font-mono font-bold w-6 text-center"
                    style={{ color: i === 0 ? "#f0c040" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#3d5c36" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <Avatar name={m.name} photoURL={m.photoURL} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-semibold text-text-base truncate">{m.name}</p>
                    <p className="font-mono text-xs text-text-dim">{m.badgeCount ?? 0} badges</p>
                  </div>
                  <span className="font-mono font-bold text-accent shrink-0">{m.totalPoints ?? 0}pts</span>
                </Card>
              </Link>
            ))}
            <Link href="/leaderboard"
              className="block text-center font-mono text-xs text-accent-dim hover:text-accent transition-colors mt-3 py-2">
              View full leaderboard →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
