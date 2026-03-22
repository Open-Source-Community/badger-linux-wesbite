import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp,
  Timestamp, writeBatch,
} from "firebase/firestore";
import { db, COLLECTIONS } from "./firebase";
import type { Badge, BadgeRequest, ClubUser, EarnedBadge, LeaderboardEntry, Season } from "@/types";

// ─── Seasons ──────────────────────────────────────────────────────────────────

export async function getActiveSeason(): Promise<Season | null> {
  const q = query(collection(db, COLLECTIONS.SEASONS), where("isActive", "==", true), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Season;
}

export async function getAllSeasons(): Promise<Season[]> {
  const snap = await getDocs(query(collection(db, COLLECTIONS.SEASONS), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Season));
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export async function getBadgesBySeason(seasonId: string): Promise<Badge[]> {
  const q = query(collection(db, COLLECTIONS.BADGES), where("seasonId", "==", seasonId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Badge));
}

export async function getBadgeById(id: string): Promise<Badge | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.BADGES, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Badge : null;
}

export async function createBadge(data: Omit<Badge, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.BADGES), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

// ─── Badge Requests ───────────────────────────────────────────────────────────

export async function submitBadgeRequest(
  data: Omit<BadgeRequest, "id" | "status" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.REQUESTS), {
    ...data,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getRequestsByUser(userId: string): Promise<BadgeRequest[]> {
  const q = query(
    collection(db, COLLECTIONS.REQUESTS),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BadgeRequest));
}

export async function getPendingRequests(): Promise<BadgeRequest[]> {
  const q = query(
    collection(db, COLLECTIONS.REQUESTS),
    where("status", "==", "pending"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BadgeRequest));
}

export async function getAllRequests(): Promise<BadgeRequest[]> {
  const q = query(collection(db, COLLECTIONS.REQUESTS), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BadgeRequest));
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUserById(uid: string): Promise<ClubUser | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } as ClubUser : null;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.USERS), orderBy("totalPoints", "desc"), limit(50))
  );
  return snap.docs.map(d => {
    const data = d.data();
    return {
      uid: d.id,
      name: data.name,
      photoURL: data.photoURL,
      totalPoints: data.totalPoints ?? 0,
      badgeCount: data.badgeCount ?? 0,
      role: data.role,
    } as LeaderboardEntry;
  });
}

export async function getEarnedBadges(userId: string): Promise<EarnedBadge[]> {
  const q = query(
    collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.EARNED),
    orderBy("earnedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as EarnedBadge));
}

// Check if a user already has a pending/approved request for a badge this season
export async function hasExistingRequest(userId: string, badgeId: string, seasonId: string): Promise<boolean> {
  const q = query(
    collection(db, COLLECTIONS.REQUESTS),
    where("userId", "==", userId),
    where("badgeId", "==", badgeId),
    where("seasonId", "==", seasonId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
