import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, discordHandle, githubUsername } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await adminDb.collection("users").doc(session.user.uid).update({
      name: name.trim(),
      discordHandle: discordHandle?.trim() ?? null,
      githubUsername: githubUsername?.trim().replace(/^@/, "") ?? null,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/users/me", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}