import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { notifyRequestApproved, notifyRequestRejected,notifyCongratulations } from "@/lib/discord";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action, reviewNote } = await req.json();
    if (!["approved", "rejected"].includes(action)) {
      return NextResponse.json({ error: "action must be approved or rejected" }, { status: 400 });
    }

    const reqRef = adminDb.collection("badgeRequests").doc(id);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const reqData = reqSnap.data()!;
    if (reqData.status !== "pending") {
      return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
    }

    const batch = adminDb.batch();
    const now = new Date().toISOString();

    batch.update(reqRef, {
      status: action,
      reviewedBy: session.user.uid,
      reviewNote: reviewNote?.trim() ?? null,
      updatedAt: now,
    });

    if (action === "approved") {
      const earnedRef = adminDb
        .collection("users")
        .doc(reqData.userId)
        .collection("earnedBadges")
        .doc(id);

      const seasonSnap = await adminDb.collection("seasons").doc(reqData.seasonId).get();

      batch.set(earnedRef, {
        badgeId: reqData.badgeId,
        badgeName: reqData.badgeName,
        badgeIcon: reqData.badgeIcon,
        badgeImageURL: reqData.badgeImageURL ?? null,
        badgeColor: reqData.badgeColor ?? "#39d353",
        badgePoints: reqData.badgePoints,
        seasonId: reqData.seasonId,
        seasonName: seasonSnap.data()?.name ?? "",
        earnedAt: now,
      });

      const userRef = adminDb.collection("users").doc(reqData.userId);
      const userSnap = await userRef.get();
      batch.update(userRef, {
        totalPoints: (userSnap.data()?.totalPoints ?? 0) + reqData.badgePoints,
        badgeCount: (userSnap.data()?.badgeCount ?? 0) + 1,
      });
    }

    await batch.commit();

    // ── Notify Discord channel ────────────────────────────────────────────────
    try {
      if (action === "approved") {
        await notifyRequestApproved({
          memberName: reqData.userName,
          badgeName: reqData.badgeName,
          badgeIcon: reqData.badgeIcon,
          badgeColor: reqData.badgeColor ?? "#39d353",
          badgePoints: reqData.badgePoints,
          reviewNote: reviewNote?.trim(),
        });

        await notifyCongratulations({
            memberName: reqData.userName,
          badgeName: reqData.badgeName,
          badgeIcon: reqData.badgeIcon,
          badgeColor: reqData.badgeColor ?? "#39d353",
          badgePoints: reqData.badgePoints,
        })
      } else {
        await notifyRequestRejected({
          memberName: reqData.userName,
          badgeName: reqData.badgeName,
          badgeIcon: reqData.badgeIcon,
          reviewNote: reviewNote?.trim(),
        });
      }
    } catch (err) {
      console.error("Discord notification failed:", err);
    }

    return NextResponse.json({ success: true, status: action });
  } catch (err) {
    console.error("PATCH /api/requests/[id]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}