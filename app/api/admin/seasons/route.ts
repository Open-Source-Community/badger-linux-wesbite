import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

// GET /api/admin/seasons  → list all seasons
export async function GET() {
  try {
    const snap = await adminDb.collection("seasons").orderBy("createdAt", "desc").get();
    const seasons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ seasons });
  } catch (err) {
    console.error("GET /api/admin/seasons", err);
    return NextResponse.json({ error: "Failed to fetch seasons" }, { status: 500 });
  }
}

// POST /api/admin/seasons  → create a new season (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, setActive } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Season name is required" }, { status: 400 });
    }

    const batch = adminDb.batch();

    // If this season should be active, deactivate all others first
    if (setActive) {
      const activeSnap = await adminDb.collection("seasons").where("isActive", "==", true).get();
      activeSnap.docs.forEach(d => batch.update(d.ref, { isActive: false }));
    }

    const newRef = adminDb.collection("seasons").doc();
    batch.set(newRef, {
      name: name.trim(),
      isActive: !!setActive,
      createdAt: new Date().toISOString(),
      createdBy: session.user.uid,
    });

    await batch.commit();

    return NextResponse.json({ id: newRef.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/seasons", err);
    return NextResponse.json({ error: "Failed to create season" }, { status: 500 });
  }
}

// PATCH /api/admin/seasons  → activate a season
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { seasonId } = body;

    if (!seasonId) return NextResponse.json({ error: "seasonId required" }, { status: 400 });

    const batch = adminDb.batch();

    // Deactivate all seasons
    const allSnap = await adminDb.collection("seasons").get();
    allSnap.docs.forEach(d => batch.update(d.ref, { isActive: false }));

    // Activate the selected one
    batch.update(adminDb.collection("seasons").doc(seasonId), { isActive: true });

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/admin/seasons", err);
    return NextResponse.json({ error: "Failed to activate season" }, { status: 500 });
  }
}
