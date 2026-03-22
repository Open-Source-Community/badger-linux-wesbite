# 🐧 Club Badge System

A full-stack Next.js 14 web app for student clubs to manage season-based badges, member requests, profiles, and a leaderboard.

**Stack:** Next.js 14 · Firebase (Firestore + Auth) · NextAuth.js · Tailwind CSS · TypeScript · Vercel

---

## ✨ Features

| Feature | Description |
|---|---|
| Google Login | Members sign in with their Google account via NextAuth |
| Season Badges | Admins create badge sets per season with custom points |
| Badge Requests | Members submit requests with proof; admins approve/reject |
| Member Profiles | Earned badges grouped by season + request history |
| Leaderboard | Members ranked by total points with a podium for top 3 |
| Admin Panel | Dashboard, request review, season & badge management |
| Role Protection | Middleware blocks non-admins from admin routes |

---

## 🚀 Local Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/club-badge-system
cd club-badge-system
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) → **Create a project**
2. Enable **Firestore Database** (start in production mode)
3. Enable **Authentication** → Sign-in method → **Google** → Enable it
4. Go to **Project Settings** → **General** → scroll to "Your apps" → **Add web app**
5. Copy the `firebaseConfig` values — you'll need them for `.env.local`
6. Go to **Project Settings** → **Service Accounts** → **Generate new private key**
7. Download the JSON file — you'll need `project_id`, `client_email`, and `private_key`

### 3. Set up Google OAuth (for NextAuth)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project → **APIs & Services** → **Credentials**
3. **Create Credentials** → **OAuth 2.0 Client ID** → Web application
4. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (local)
   - `https://YOUR_APP.vercel.app/api/auth/callback/google` (production)
5. Copy the **Client ID** and **Client Secret**

### 4. Create `.env.local`

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR KEY\n-----END PRIVATE KEY-----\n"

# NextAuth
NEXTAUTH_SECRET=run `openssl rand -base64 32` to generate this
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 5. Set up Firestore security rules

In Firebase Console → Firestore → **Rules**, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Anyone can read users and leaderboard
    match /users/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;

      // Earned badges sub-collection
      match /earnedBadges/{badgeId} {
        allow read: if true;
        allow write: if false; // only server (admin SDK) writes
      }
    }

    // Seasons and badges are public read
    match /seasons/{id} {
      allow read: if true;
      allow write: if false; // server only
    }

    match /badges/{id} {
      allow read: if true;
      allow write: if false; // server only
    }

    // Badge requests
    match /badgeRequests/{id} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if false; // server only
    }
  }
}
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 👑 Making Yourself an Admin

After signing in for the first time:

1. Go to **Firebase Console** → **Firestore** → `users` collection
2. Find your user document (it was created automatically on first login)
3. Change the `role` field from `"member"` to `"admin"`
4. Refresh the site — you'll now see the `~/admin` link in the navbar

---

## 🌐 Deploy to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

### Option B — GitHub + Vercel Dashboard

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Framework: **Next.js** (auto-detected)
4. Add all environment variables from `.env.local` in the Vercel dashboard
5. For `NEXTAUTH_URL`, set it to `https://YOUR_APP.vercel.app`
6. For `FIREBASE_ADMIN_PRIVATE_KEY`, paste the full key including `\n` characters
7. Click **Deploy**

### After deploying

- Go back to Google Cloud Console → OAuth credentials → add your Vercel URL to **Authorized redirect URIs**:
  `https://YOUR_APP.vercel.app/api/auth/callback/google`
- Go to Firebase Console → Authentication → **Authorized domains** → add your Vercel domain

---

## 📁 Project Structure

```
club-badge-system/
├── app/
│   ├── page.tsx                    # Home / landing
│   ├── login/page.tsx              # Google sign-in
│   ├── badges/
│   │   ├── page.tsx                # Browse season badges
│   │   └── [id]/request/page.tsx  # Submit badge request
│   ├── leaderboard/page.tsx        # Ranked members
│   ├── profile/[uid]/page.tsx      # Member profile
│   ├── admin/
│   │   ├── page.tsx                # Admin dashboard
│   │   ├── requests/page.tsx       # Approve / reject
│   │   └── seasons/page.tsx        # Create seasons & badges
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth handler
│       ├── badges/route.ts         # Badge CRUD
│       ├── requests/
│       │   ├── route.ts            # Submit / list requests
│       │   └── [id]/route.ts       # Approve / reject
│       └── admin/seasons/route.ts  # Season management
├── components/
│   ├── layout/Navbar.tsx           # Top nav
│   └── ui/index.tsx                # Shared components
├── lib/
│   ├── firebase.ts                 # Client SDK
│   ├── firebase-admin.ts           # Admin SDK (server only)
│   ├── auth.ts                     # NextAuth config
│   └── db.ts                       # Firestore helpers
├── types/
│   ├── index.ts                    # All TypeScript types
│   └── next-auth.d.ts              # Session augmentation
├── middleware.ts                   # Route protection
├── .env.example                    # Env var template
└── vercel.json                     # Vercel config
```

---

## 🔄 Typical Admin Workflow

1. **Start a season** → Admin panel → Seasons → Create "Spring 2025" → Set active
2. **Add badges** → Select the season → Fill in name, icon, description, points, category
3. **Members sign in** → Browse badges → Submit requests with proof
4. **Admins review** → Admin panel → Requests → Approve or Reject (with optional note)
5. **Points update automatically** → Leaderboard re-ranks instantly

---

## 🛠️ Customization

| What to change | Where |
|---|---|
| Club name / branding | `app/layout.tsx`, `components/layout/Navbar.tsx` |
| Color theme | `tailwind.config.js` and `app/globals.css` |
| Badge categories | `types/index.ts` → `BadgeCategory` + `app/badges/page.tsx` |
| Leaderboard size | `app/leaderboard/page.tsx` → change `limit(50)` |
| Admin emails | Manually set `role: "admin"` in Firestore |
