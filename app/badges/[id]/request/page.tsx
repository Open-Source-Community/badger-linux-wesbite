"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Terminal, Card, SectionLabel, CategoryTag } from "@/components/ui";
import type { Badge } from "@/types";

export default function RequestBadgePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params =  useParams();
  const badgeId = params.id as string;

  const [badge, setBadge] = useState<Badge | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

useEffect(() => {
  fetch(`/api/badges`)
    .then(r => r.json())
    .then(data => {
      console.log("all badges:", data.badges)
      console.log("looking for id:", badgeId)
      const found = data.badges?.find((b: Badge) => b.id === badgeId);
      console.log("found:", found)
      setBadge(found ?? null);
      setLoading(false);
    });
}, [badgeId]);

  const handleSubmit = async () => {
    if (!note.trim()) return;
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badgeId, note }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <span className="font-mono text-text-dim text-sm animate-pulse">Loading badge...</span>
    </div>
  );

  if (!badge) return (
    <div className="text-center py-24">
      <p className="font-mono text-text-muted mb-4">Badge not found or season is inactive.</p>
      <Link href="/badges" className="font-mono text-sm text-accent hover:underline">← Back to badges</Link>
    </div>
  );

  if (submitted) return (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="font-mono font-bold text-2xl text-accent mb-2">Request Submitted!</h2>
        <p className="font-sans text-sm text-text-dim">Admins will review your request soon.</p>
      </div>
      <Terminal lines={[
        "$ badge request --status",
        "",
        `Submitted: ${badge.name}`,
        "Status: PENDING ⏳",
        "Admins have been notified.",
        "",
        "# Check your profile for updates",
      ]} />
      <div className="flex gap-3 mt-6">
        <Link href="/badges"
          className="flex-1 text-center font-mono text-sm border border-border text-text-dim py-3 rounded-lg hover:border-accent/30 hover:text-accent transition-all">
          ← More badges
        </Link>
        <Link href={`/profile/${session?.user?.uid}`}
          className="flex-1 text-center font-mono text-sm bg-accent/10 border border-accent/30 text-accent py-3 rounded-lg hover:bg-accent/20 transition-all">
          My profile →
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <Link href="/badges" className="font-mono text-xs text-text-muted hover:text-accent transition-colors mb-6 inline-block">
        ← Back to badges
      </Link>

      <SectionLabel>Badge Request</SectionLabel>

      {/* Badge info card */}
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-4">
          <span className="text-5xl shrink-0">{badge.icon}</span>
          <div className="flex-1">
            <h1 className="font-mono font-bold text-xl text-text-base mb-1">{badge.name}</h1>
            <div className="flex items-center gap-2 mb-3">
              <CategoryTag>{badge.category}</CategoryTag>
              <span className="font-mono text-sm font-bold text-accent">{badge.points} points</span>
            </div>
            <p className="font-sans text-sm text-text-dim leading-relaxed">{badge.description}</p>
          </div>
        </div>
      </Card>

      {/* Request form */}
      <Card className="p-6">
        <h2 className="font-mono text-sm font-semibold text-text-base mb-1">
          Prove you earned it
        </h2>
        <p className="font-sans text-xs text-text-dim mb-5 leading-relaxed">
          Describe what you did, share a repo link, a screenshot URL, or any proof that helps admins verify your request.
        </p>

        <label className="font-mono text-xs text-text-dim block mb-2">
          Your justification / proof:
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={5}
          placeholder="e.g. I built a custom kernel module for USB monitoring. Repo: github.com/me/usb-mod — also presented at the March meetup."
          className="w-full bg-bg border border-border rounded-lg p-3 text-text-base font-sans text-sm leading-relaxed outline-none focus:border-accent/40 transition-colors resize-y placeholder:text-text-muted"
        />

        {error && (
          <p className="font-mono text-xs text-red-400 mt-2">{error}</p>
        )}

        <div className="mt-4 p-3 bg-accent/5 border border-accent/15 rounded-lg">
          <p className="font-mono text-xs text-text-muted leading-relaxed">
            ℹ️ Submitting a request does not guarantee approval. Admins will review and may ask for more proof.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!note.trim() || submitting}
          className="w-full mt-5 py-3 font-mono text-sm font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: note.trim() && !submitting ? "#39d353" : undefined,
            backgroundColor: !note.trim() || submitting ? "#3d5c36" : undefined,
            color: "#0a0e0a",
            boxShadow: note.trim() && !submitting ? "0 0 20px rgba(57,211,83,0.2)" : "none",
          }}>
          {submitting ? "Submitting..." : "$ submit --request"}
        </button>
      </Card>
    </div>
  );
}
