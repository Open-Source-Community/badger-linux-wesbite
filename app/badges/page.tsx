import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import Link from "next/link";
import { Card, SectionLabel, EmptyState } from "@/components/ui";
import type { Badge, Season, BadgeRequest } from "@/types";

async function getData(userId?: string) {
  const seasonSnap = await adminDb.collection("seasons").where("isActive", "==", true).limit(1).get();
  if (seasonSnap.empty) return { season: null, badges: [], myRequestedBadgeIds: new Set<string>(), myEarnedBadgeIds: new Set<string>() };

  const season = { id: seasonSnap.docs[0].id, ...seasonSnap.docs[0].data() } as Season;
  const badgesSnap = await adminDb.collection("badges").where("seasonId", "==", season.id).get();
  const badges = badgesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Badge[];

  let myRequestedBadgeIds = new Set<string>();
  let myEarnedBadgeIds = new Set<string>();

  if (userId) {
    const [reqSnap, earnedSnap] = await Promise.all([
      adminDb.collection("badgeRequests").where("userId", "==", userId).where("seasonId", "==", season.id).where("status", "in", ["pending", "approved"] ).get(),
      adminDb.collection("users").doc(userId).collection("earnedBadges").get(),
    ]);
    reqSnap.docs.forEach(d => myRequestedBadgeIds.add((d.data() as BadgeRequest).badgeId));
    earnedSnap.docs.forEach(d => myEarnedBadgeIds.add(d.data().badgeId));
  }

  return { season, badges, myRequestedBadgeIds, myEarnedBadgeIds };
}

function BadgeIcon({ badge, size = 56 }: { badge: Badge; size?: number }) {
  if (badge.imageURL) {
    return (
      <img src={badge.imageURL} alt={badge.name}
        className="rounded-xl object-cover"
        style={{ width: size, height: size, border: `2px solid ${badge.color}40` }} />
    );
  }
  return (
    <div className="rounded-xl flex items-center justify-center"
      style={{ width: size, height: size, fontSize: size * 0.5, background: `${badge.color}15`, border: `2px solid ${badge.color}30` }}>
      {badge.icon}
    </div>
  );
}

export default async function BadgesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category: activeCategory = "All" } = await searchParams;
  const session = await getServerSession(authOptions);
  const { season, badges, myRequestedBadgeIds, myEarnedBadgeIds } = await getData(session?.user?.uid);

  // Get unique categories from actual badges
  const categories = ["All", ...Array.from(new Set(badges.map(b => b.category))).sort()];
  const filtered = activeCategory === "All" ? badges : badges.filter(b => b.category === activeCategory);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <SectionLabel>{season ? `Season: ${season.name}` : "No active season"}</SectionLabel>
        <h1 className="font-mono font-bold text-3xl text-text-base mb-6">Available Badges</h1>

        {/* Category filter — dynamic from actual badges */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <Link key={cat} href={`/badges?category=${cat}`}
              className={`font-mono text-xs px-4 py-1.5 rounded-md border transition-all ${
                activeCategory === cat
                  ? "bg-accent/10 border-accent text-accent"
                  : "border-border text-text-dim hover:text-text-base hover:border-text-muted"
              }`}>
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {!season && <EmptyState icon="📭" message="No active season right now. Check back soon." />}
      {season && filtered.length === 0 && <EmptyState icon="🔍" message="No badges in this category yet." />}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(badge => {
          const earned = myEarnedBadgeIds.has(badge.id);
          const requested = myRequestedBadgeIds.has(badge.id);

          return (
      <Card
  key={badge.id}
  className="p-5 flex flex-col relative overflow-hidden transition-all hover:border-white/10"
  style={earned ? { borderColor: badge.color + "66" } : {}}
>
              {/* Earned/Requested status */}
              {earned && (
                <span className="absolute top-3 right-3 font-mono text-[10px] px-2 py-0.5 rounded border font-bold"
                  style={{ color: badge.color, borderColor: `${badge.color}40`, background: `${badge.color}15` }}>
                  ✓ Earned
                </span>
              )}
              {!earned && requested && (
                <span className="absolute top-3 right-3 font-mono text-[10px] px-2 py-0.5 rounded border text-yellow-400 border-yellow-400/30 bg-yellow-400/10">
                  ⏳ Pending
                </span>
              )}

              <BadgeIcon badge={badge} size={56} />

              <h2 className="font-mono font-semibold text-base mt-3 mb-1"
                style={{ color: badge.color }}>{badge.name}</h2>
              <p className="font-sans text-sm text-text-dim leading-relaxed flex-1 mb-4">{badge.description}</p>

              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs px-2 py-0.5 rounded border"
                  style={{ color: badge.color, borderColor: `${badge.color}30`, background: `${badge.color}10` }}>
                  {badge.category}
                </span>
                <span className="font-mono font-bold text-base" style={{ color: badge.color }}>{badge.points}pts</span>
              </div>

              {session ? (
                earned ? (
                  <div className="font-mono text-xs text-text-muted text-center py-2.5 border border-border rounded-lg">
                    Already earned 🎉
                  </div>
                ) : requested ? (
                  <div className="font-mono text-xs text-yellow-400/70 text-center py-2.5 border border-yellow-400/20 rounded-lg">
                    Request under review
                  </div>
                ) : (
                  <Link href={`/badges/${badge.id}/request`}
                    className="block text-center font-mono text-xs font-semibold py-2.5 rounded-lg transition-all"
                    style={{ background: `${badge.color}15`, border: `1px solid ${badge.color}30`, color: badge.color }}>
                    $ request this badge →
                  </Link>
                )
              ) : (
                <Link href="/login"
                  className="block text-center font-mono text-xs text-text-muted border border-border py-2.5 rounded-lg hover:text-accent hover:border-accent/30 transition-all">
                  Login to request →
                </Link>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}