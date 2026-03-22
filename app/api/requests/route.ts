import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { notifyNewRequest,notifyCongratulations } from "@/lib/discord";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    let q: any = adminDb.collection("badgeRequests").orderBy("createdAt", "desc");
    if (session.user.role !== "admin") {
      q = q.where("userId", "==", session.user.uid);
    } else if (userId) {
      q = q.where("userId", "==", userId);
    }
    if (status) q = q.where("status", "==", status);

    const snap = await q.get();
    const requests = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ requests });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { badgeId, note } = await req.json();
    if (!badgeId || !note?.trim()) {
      return NextResponse.json({ error: "badgeId and note are required" }, { status: 400 });
    }

    // Fetch badge
    const badgeSnap = await adminDb.collection("badges").doc(badgeId).get();
    if (!badgeSnap.exists) return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    const badge = badgeSnap.data()!;

    // Check season is active
    const seasonSnap = await adminDb.collection("seasons").doc(badge.seasonId).get();
    if (!seasonSnap.exists || !seasonSnap.data()?.isActive) {
      return NextResponse.json({ error: "Season is not active" }, { status: 400 });
    }

    // Check for duplicate
    const dupSnap = await adminDb.collection("badgeRequests")
      .where("userId", "==", session.user.uid)
      .where("badgeId", "==", badgeId)
      .where("seasonId", "==", badge.seasonId)
       .where("status", "in", ["pending", "approved"]) 
      .get();
    if (!dupSnap.empty) {
      return NextResponse.json({ error: "You already have a request for this badge" }, { status: 409 });
    }

    // Fetch user
    const userSnap = await adminDb.collection("users").doc(session.user.uid).get();
    const user = userSnap.data();

    const now = new Date().toISOString();
    const ref = await adminDb.collection("badgeRequests").add({
      badgeId,
      badgeName: badge.name,
      badgeIcon: badge.icon,
      badgeImageURL: badge.imageURL ?? null,
      badgeColor: badge.color ?? "#39d353",
      badgePoints: badge.points,
      seasonId: badge.seasonId,
      userId: session.user.uid,
      userName: user?.name ?? session.user.name,
      userPhotoURL: user?.photoURL ?? session.user.image ?? null,
      userEmail: user?.email ?? session.user.email,
      note: note.trim(),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // ── Notify Discord channel ────────────────────────────────────────────────
    try {
      await notifyNewRequest({
        memberName: user?.name ?? session.user.name ?? "A member",
        memberEmail: user?.email ?? session.user.email ?? "",
        badgeName: badge.name,
        badgeIcon: badge.icon,
        badgeColor: badge.color ?? "#39d353",
        note: note.trim(),
        requestId: ref.id,
      });

    } catch (err) {
      console.error("Discord notification failed:", err);
    }

    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/requests", err);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}