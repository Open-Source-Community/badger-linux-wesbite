import { adminDb } from "@/lib/firebase-admin";
import Link from "next/link";
import { Card, SectionLabel, Avatar } from "@/components/ui";
import type { LeaderboardEntry } from "@/types";

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const snap = await adminDb.collection("users").orderBy("totalPoints", "desc").limit(50).get();
  return snap.docs.map(d => {
    const data = d.data();
    return {
      uid: d.id,
      name: data.name,
      photoURL: data.photoURL ?? null,
      totalPoints: data.totalPoints ?? 0,
      badgeCount: data.badgeCount ?? 0,
      role: data.role,
    };
  });
}

const RANK_COLORS = ["#f0c040", "#c0c0c0", "#cd7f32"];
const RANK_ICONS = ["🥇", "🥈", "🥉"];
const PODIUM_HEIGHTS = [140, 180, 110]; // silver, gold, bronze

export default async function LeaderboardPage() {
  const members = await getLeaderboard();

  return (
    <div className="animate-fade-in">
      <SectionLabel>Current season</SectionLabel>
      <h1 className="font-mono font-bold text-3xl text-text-base mb-10">Leaderboard</h1>

      {members.length === 0 && (
        <div className="text-center py-24 font-mono text-text-muted">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-sm">No members yet. Be the first to earn a badge!</p>
        </div>
      )}

      {/* Podium — top 3 */}
      {members.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-14 px-4">
          {[members[1], members[0], members[2]].map((m, vi) => {
            const rank = vi === 0 ? 2 : vi === 1 ? 1 : 3;
            return (
              <Link key={m.uid} href={`/profile/${m.uid}`}
                className="flex flex-col items-center gap-3 group">
                <Avatar name={m.name} photoURL={m.photoURL} size={rank === 1 ? 56 : 44} />
                <div className="text-center">
                  <p className="font-sans text-sm font-semibold text-text-base group-hover:text-accent transition-colors truncate max-w-[100px]">
                    {m.name.split(" ")[0]}
                  </p>
                  <p className="font-mono text-sm font-bold text-accent">{m.totalPoints}pts</p>
                </div>
                <div
                  className="w-24 flex flex-col items-center justify-start pt-3 rounded-t-lg border-t border-x"
                  style={{
                    height: PODIUM_HEIGHTS[vi],
                    background: `linear-gradient(to top, ${RANK_COLORS[rank - 1]}15, ${RANK_COLORS[rank - 1]}05)`,
                    borderColor: `${RANK_COLORS[rank - 1]}30`,
                  }}>
                  <span style={{ fontSize: rank === 1 ? 28 : 20 }}>{RANK_ICONS[rank - 1]}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_auto_auto] gap-4 px-5 py-3 border-b border-border font-mono text-[10px] text-text-muted tracking-widest uppercase">
          <span>Rank</span>
          <span>Member</span>
          <span className="text-right">Badges</span>
          <span className="text-right">Points</span>
        </div>

        {members.map((m, i) => (
          <Link key={m.uid} href={`/profile/${m.uid}`}
            className="grid grid-cols-[40px_1fr_auto_auto] gap-4 px-5 py-4 border-b border-border items-center hover:bg-white/[0.015] transition-all"
            style={{ background: i === 0 ? "rgba(57,211,83,0.03)" : undefined }}>
            <span className="font-mono font-bold text-base text-center"
              style={{ color: i < 3 ? RANK_COLORS[i] : "#3d5c36" }}>
              {i < 3 ? RANK_ICONS[i] : `#${i + 1}`}
            </span>

            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={m.name} photoURL={m.photoURL} size={36} />
              <div className="min-w-0">
                <p className="font-sans text-sm font-semibold text-text-base truncate">{m.name}</p>
                <p className="font-mono text-xs text-text-dim">
                  {m.role === "admin" && (
                    <span className="mr-2 text-yellow-400/70">admin</span>
                  )}
                </p>
              </div>
            </div>

            <span className="font-mono text-sm text-text-dim text-right">{m.badgeCount}</span>
            <span className="font-mono font-bold text-lg text-accent text-right">{m.totalPoints}</span>
          </Link>
        ))}
      </Card>
    </div>
  );
}
