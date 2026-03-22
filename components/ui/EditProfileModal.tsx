"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";

interface Props {
  initialName: string;
  initialDiscord: string;
  initialGithub: string;
  onClose: () => void;
  onSaved: (data: { name: string; discordHandle: string; githubUsername: string }) => void;
}

export function EditProfileModal({ initialName, initialDiscord, initialGithub, onClose, onSaved }: Props) {
  const [name, setName] = useState(initialName);
  const [discord, setDiscord] = useState(initialDiscord);
  const [github, setGithub] = useState(initialGithub);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
const {update} = useSession();
  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        discordHandle: discord,
        githubUsername: github,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }
await update({name})
    onSaved({ name, discordHandle: discord, githubUsername: github });
    setLoading(false);
    onClose();
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="w-full max-w-md rounded-xl border border-border p-6"
        style={{ background: "#111611" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono font-bold text-lg text-text-base">Edit Profile</h2>
          <button onClick={onClose} className="font-mono text-text-muted hover:text-text-base transition-colors text-lg">✕</button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">
            Display Name *
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 font-sans text-sm text-text-base outline-none focus:border-accent/40 transition-colors placeholder:text-text-muted"
          />
        </div>

        {/* Discord */}
        <div className="mb-4">
          <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">
            Discord Handle
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-text-muted">@</span>
            <input
              value={discord.replace(/^@/, "")}
              onChange={e => setDiscord(e.target.value)}
              placeholder="yourhandle"
              className="w-full bg-bg border border-border rounded-lg pl-7 pr-3 py-2.5 font-mono text-sm text-text-base outline-none focus:border-accent/40 transition-colors placeholder:text-text-muted"
            />
          </div>
          <p className="font-mono text-[10px] text-text-muted mt-1">Used to mention you in Discord notifications</p>
        </div>

        {/* GitHub */}
        <div className="mb-6">
          <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">
            GitHub Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-text-muted">github.com/</span>
            <input
              value={github}
              onChange={e => setGithub(e.target.value)}
              placeholder="yourusername"
              className="w-full bg-bg border border-border rounded-lg pl-[88px] pr-3 py-2.5 font-mono text-sm text-text-base outline-none focus:border-accent/40 transition-colors placeholder:text-text-muted"
            />
          </div>
        </div>

        {error && <p className="font-mono text-xs text-red-400 mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="flex-1 py-3 font-mono text-sm font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#39d353", color: "#0a0e0a", boxShadow: "0 0 16px rgba(57,211,83,0.2)" }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={onClose}
            className="px-5 font-mono text-sm text-text-dim border border-border rounded-lg hover:border-accent/30 hover:text-accent transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}