import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { uploadBadgeImage } from "@/lib/cloudinary";

// GET /api/badges?seasonId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId");

    let q: any = adminDb.collection("badges").orderBy("createdAt", "asc");
    if (seasonId && seasonId !== "active") {
      q = q.where("seasonId", "==", seasonId);
    }

    const snap = await q.get();
    const badges = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ badges });
  } catch (err) {
    console.error("GET /api/badges", err);
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
  }
}

// POST /api/badges → multipart/form-data (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const seasonId    = formData.get("seasonId") as string;
    const name        = formData.get("name") as string;
    const icon        = formData.get("icon") as string;
    const description = formData.get("description") as string;
    const points      = formData.get("points") as string;
    const category    = formData.get("category") as string;
    const color       = formData.get("color") as string;
    const imageFile   = formData.get("image") as File | null;

    if (!seasonId || !name || !icon || !description || !points || !category || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify season exists
    const seasonSnap = await adminDb.collection("seasons").doc(seasonId).get();
    if (!seasonSnap.exists) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    // Upload image to Cloudinary if provided
    let imageURL: string | null = null;
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${seasonId}_${Date.now()}_${name.replace(/\s+/g, "-").toLowerCase()}`;
      imageURL = await uploadBadgeImage(buffer, filename);
    }

    const ref = await adminDb.collection("badges").add({
      seasonId,
      name: name.trim(),
      icon: icon.trim(),
      imageURL,
      description: description.trim(),
      points: Number(points),
      category: category.trim(),
      color: color.trim(),
      createdAt: new Date().toISOString(),
      createdBy: session.user.uid,
    });

    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/badges", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}