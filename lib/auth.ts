import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

callbacks: {
  async signIn({ user, account }) {
    if (account?.provider !== "google") return false;
    if (!user.email || !user.name) return false;
    const userRef = adminDb.collection("users").doc(user.id);
    const snap = await userRef.get();
    if (!snap.exists) {
      await userRef.set({
        uid: user.id,
        email: user.email,
        name: user.name,
        photoURL: user.image ?? null,
        role: "member",
        totalPoints: 0,
        createdAt: new Date().toISOString(),
      });
    } else {
      await userRef.update({
        name: user.name,
        photoURL: user.image ?? null,
      });
    }
    return true;
  },
async jwt({ token, user, trigger, session }) {
  if (user || trigger === "update") {
    const uid = token.sub!
    token.uid = uid
    const snap = await adminDb.collection("users").doc(uid).get();
    token.name = snap.data()?.name ?? token.name  // ← read name from Firestore
    token.role = snap.data()?.role ?? "member";
  }
  return token;
},

async session({ session, token }) {
  session.user.uid = token.sub as string
  session.user.role = (token.role as "member" | "admin") ?? "member";
  session.user.name = token.name as string  // ← pass name to session
  return session;
},
},

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
