export const revalidate = 0;
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { Card, SectionLabel, Avatar, BadgePill, StatusPill, EmptyState } from "@/components/ui";
import type { ClubUser, EarnedBadge, BadgeRequest } from "@/types";
import { ProfileClient } from "./ProfileClient";

async function getProfileData(uid: string) {
  const [userSnap, requestsSnap, leaderSnap] = await Promise.all([
    adminDb.collection("users").doc(uid).get(),
    adminDb.collection("badgeRequests").where("userId", "==", uid).orderBy("createdAt", "desc").get(),
    adminDb.collection("users").orderBy("totalPoints", "desc").limit(100).get(),
  ]);

  const earnedSnap = await adminDb
    .collection("users").doc(uid)
    .collection("earnedBadges").get();

  if (!userSnap.exists) return null;

  const user = { uid: userSnap.id, ...userSnap.data() } as ClubUser & {
    discordHandle?: string;
    githubUsername?: string;
  };
  const earnedBadges = earnedSnap.docs.map(d => ({ id: d.id, ...d.data() })) as EarnedBadge[];
  const requests = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as BadgeRequest[];
  const rank = leaderSnap.docs.findIndex(d => d.id === uid) + 1;

  return { user, earnedBadges, requests, rank };
}

export default async function ProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const session = await getServerSession(authOptions);
  const data = await getProfileData(uid);

  if (!data) notFound();

  const { user, earnedBadges, requests, rank } = data;
  const isOwnProfile = session?.user?.uid === uid;

  // Group earned badges by season
  const bySeason = earnedBadges.reduce<Record<string, EarnedBadge[]>>((acc, b) => {
    const key = b.seasonName || "Unknown Season";
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      {/* Profile header — client component to handle edit modal */}
      <ProfileClient
        user={user}
        rank={rank}
        earnedCount={earnedBadges.length}
        requestCount={requests.length}
        isOwnProfile={isOwnProfile}
      />

      {/* Earned badges */}
      <div className="mb-6">
        <SectionLabel>Earned Badges</SectionLabel>
        {earnedBadges.length === 0 && <EmptyState icon="🏅" message="No badges earned yet." />}
        {Object.entries(bySeason).map(([seasonName, badges]) => (
          <div key={seasonName} className="mb-5">
            <p className="font-mono text-xs text-text-muted mb-3 tracking-wider">{seasonName}</p>
            <div className="flex flex-wrap gap-2">
              {badges.map(b => (
                <BadgePill key={b.id} icon={b.badgeIcon} name={b.badgeName} points={b.badgePoints} earned />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Request history */}
      {(isOwnProfile || session?.user?.role === "admin") && (
        <div>
          <SectionLabel>Request History</SectionLabel>
          {requests.length === 0 && <EmptyState icon="📋" message="No requests submitted yet." />}
          <div className="space-y-2">
            {requests.map(r => (
              <Card key={r.id} className="flex items-center gap-4 p-4">
                <span className="text-2xl shrink-0">{r.badgeIcon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-text-base font-medium">{r.badgeName}</p>
                  <p className="font-sans text-xs text-text-dim truncate mt-0.5">{r.note}</p>
                  <p className="font-mono text-xs text-text-muted mt-1">
                    {new Date(r.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusPill status={r.status} />
                  <span className="font-mono text-xs text-accent">+{r.badgePoints}pts</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}