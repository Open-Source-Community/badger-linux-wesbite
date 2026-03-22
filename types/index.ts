// ─── User ─────────────────────────────────────────────────────────────────────
export interface ClubUser {
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;
  role: "member" | "admin";
  totalPoints: number;
  createdAt: string;
}

// ─── Season ───────────────────────────────────────────────────────────────────
export interface Season {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export interface Badge {
  id: string;
  seasonId: string;
  name: string;
  icon: string;             // emoji (always required)
  imageURL?: string | null; // optional uploaded image (Firebase Storage)
  description: string;
  points: number;
  category: string;         // free text — admin defines it
  color: string;            // hex color e.g. "#39d353"
  createdAt: string;
  createdBy: string;
}

// ─── Badge Request ────────────────────────────────────────────────────────────
export type RequestStatus = "pending" | "approved" | "rejected";

export interface BadgeRequest {
  id: string;
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  badgeImageURL?: string | null;
  badgeColor: string;
  badgePoints: number;
  seasonId: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  note: string;
  status: RequestStatus;
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Earned Badge ─────────────────────────────────────────────────────────────
export interface EarnedBadge {
  id: string;
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  badgeImageURL?: string | null;
  badgeColor: string;
  badgePoints: number;
  seasonId: string;
  seasonName: string;
  earnedAt: string;
}

// ─── Leaderboard entry ────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  uid: string;
  name: string;
  photoURL: string | null;
  totalPoints: number;
  badgeCount: number;
  role: "member" | "admin";
}