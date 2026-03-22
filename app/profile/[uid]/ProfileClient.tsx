"use client";
import { useState } from "react";
import { Card, Avatar } from "@/components/ui";
import { EditProfileModal } from "@/components/ui/EditProfileModal";

interface Props {
  user: {
    uid: string;
    name: string;
    email: string;
    photoURL: string | null;
    role: "member" | "admin";
    totalPoints: number;
    discordHandle?: string;
    githubUsername?: string;
  };
  rank: number;
  earnedCount: number;
  requestCount: number;
  isOwnProfile: boolean;
}

export function ProfileClient({ user, rank, earnedCount, requestCount, isOwnProfile }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [localUser, setLocalUser] = useState(user);

  const handleSaved = (data: { name: string; discordHandle: string; githubUsername: string }) => {
    setLocalUser(prev => ({ ...prev, ...data }));
  };

  return (
    <>
      <Card className="p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 80% at 0% 50%, rgba(57,211,83,0.06), transparent)" }} />

        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <Avatar name={localUser.name} photoURL={localUser.photoURL} size={72} />

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-mono font-bold text-xl text-text-base">{localUser.name}</h1>
              {localUser.role === "admin" && (
                <span className="font-mono text-xs px-2 py-0.5 rounded border border-yellow-400/30 bg-yellow-400/10 text-yellow-400">
                  admin
                </span>
              )}
              {isOwnProfile && (
                <span className="font-mono text-xs px-2 py-0.5 rounded border border-accent/30 bg-accent/10 text-accent">
                  you
                </span>
              )}
            </div>

            <p className="font-sans text-sm text-text-dim mb-3">{localUser.email}</p>

            {/* Discord + GitHub handles */}
            <div className="flex gap-4 flex-wrap mb-4">
              {localUser.discordHandle && (
                <span className="font-mono text-xs text-text-dim flex items-center gap-1.5">
                  <span style={{ color: "#5865F2" }}>⬡</span>
                  @{localUser.discordHandle.replace(/^@/, "")}
                </span>
              )}
              {localUser.githubUsername && (
                <a
                  href={`https://github.com/${localUser.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-text-dim hover:text-accent transition-colors flex items-center gap-1.5"
                >
                  <span>⌥</span>
                  github.com/{localUser.githubUsername}
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 flex-wrap">
              {[
                { label: "Points", value: localUser.totalPoints ?? 0, color: "#39d353" },
                { label: "Badges", value: earnedCount, color: "#4a9eff" },
                { label: "Rank", value: rank > 0 ? `#${rank}` : "—", color: "#f0c040" },
                { label: "Requests", value: requestCount, color: "#6b8f63" },
              ].map(s => (
                <div key={s.label}>
                  <p className="font-mono font-bold text-2xl" style={{ color: s.color }}>{s.value}</p>
                  <p className="font-sans text-xs text-text-dim">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Edit button — only on own profile */}
          {isOwnProfile && (
            <button
              onClick={() => setShowModal(true)}
              className="shrink-0 font-mono text-xs border border-border text-text-dim px-4 py-2 rounded-lg hover:border-accent/30 hover:text-accent transition-all"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>
      </Card>

      {/* Edit modal */}
      {showModal && (
        <EditProfileModal
          initialName={localUser.name}
          initialDiscord={localUser.discordHandle ?? ""}
          initialGithub={localUser.githubUsername ?? ""}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}