"use client";
import { Suspense } from "react";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, SectionLabel, Avatar, StatusPill } from "@/components/ui";
import type { BadgeRequest } from "@/types";

type FilterStatus = "pending" | "approved" | "rejected" | "all";

function AdminRequestsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = (searchParams.get("status") ?? "pending") as FilterStatus;

  const [requests, setRequests] = useState<BadgeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>(filterParam);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const url = filter === "all" ? "/api/requests" : `/api/requests?status=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    setRequests(data.requests ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    setProcessing(id);
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewNote: reviewNote[id] ?? "" }),
    });
    if (res.ok) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    }
    setProcessing(null);
  };

  const FILTERS: { value: FilterStatus; label: string; color: string }[] = [
    { value: "pending", label: "Pending", color: "#f0c040" },
    { value: "approved", label: "Approved", color: "#39d353" },
    { value: "rejected", label: "Rejected", color: "#e05252" },
    { value: "all", label: "All", color: "#6b8f63" },
  ];

  const counts = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <Link href="/admin" className="font-mono text-xs text-text-muted hover:text-accent transition-colors">
          ← Dashboard
        </Link>
        <div>
          <p className="font-mono text-xs text-yellow-400 tracking-widest mb-0.5">⚡ ADMIN PANEL</p>
          <h1 className="font-mono font-bold text-2xl text-text-base">Badge Requests</h1>
        </div>
      </div>

      {/* Filter tabs */}
      <Card className="overflow-hidden mb-6">
        <div className="flex">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className="flex-1 py-3.5 font-mono text-xs font-semibold tracking-wider uppercase transition-all border-b-2"
              style={{
                color: filter === f.value ? f.color : "#3d5c36",
                borderBottomColor: filter === f.value ? f.color : "transparent",
                background: filter === f.value ? `${f.color}10` : "transparent",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {loading && (
        <div className="text-center py-12 font-mono text-sm text-text-muted animate-pulse">
          Loading requests...
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="text-center py-16 font-mono text-text-muted">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">No {filter === "all" ? "" : filter} requests.</p>
        </div>
      )}

      <div className="space-y-4">
        {requests.map(r => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Badge + member info */}
              <div className="flex gap-4 flex-1 min-w-0">
                <span className="text-4xl shrink-0">{r.badgeIcon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-mono font-semibold text-base text-text-base">{r.badgeName}</h2>
                    <span className="font-mono text-xs font-bold text-accent">+{r.badgePoints}pts</span>
                    <StatusPill status={r.status} />
                  </div>

                  {/* Member */}
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar name={r.userName} photoURL={r.userPhotoURL} size={22} />
                    <Link href={`/profile/${r.userId}`}
                      className="font-mono text-xs text-text-dim hover:text-accent transition-colors">
                      {r.userName}
                    </Link>
                    <span className="font-mono text-xs text-text-muted">
                      · {new Date(r.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {/* Member's note */}
                  <div className="bg-bg border border-border rounded-lg p-3 mb-3">
                    <p className="font-mono text-[10px] text-text-muted mb-1 tracking-wider">MEMBER'S NOTE</p>
                    <p className="font-sans text-sm text-text-dim leading-relaxed">{r.note}</p>
                  </div>

                  {/* Admin review note (if already reviewed) */}
                  {r.reviewNote && (
                    <div className="bg-bg border border-border rounded-lg p-3 mb-3">
                      <p className="font-mono text-[10px] text-text-muted mb-1 tracking-wider">ADMIN NOTE</p>
                      <p className="font-sans text-sm text-text-dim leading-relaxed">{r.reviewNote}</p>
                    </div>
                  )}

                  {/* Review actions — only for pending */}
                  {r.status === "pending" && (
                    <div className="space-y-2">
                      <textarea
                        value={reviewNote[r.id] ?? ""}
                        onChange={e => setReviewNote(prev => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Optional: add a note to the member (e.g. reason for rejection)"
                        rows={2}
                        className="w-full bg-bg border border-border rounded-lg p-2.5 font-sans text-xs text-text-base outline-none focus:border-accent/30 transition-colors resize-none placeholder:text-text-muted"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(r.id, "approved")}
                          disabled={processing === r.id}
                          className="flex-1 py-2.5 font-mono text-xs font-bold rounded-lg border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-all disabled:opacity-50">
                          {processing === r.id ? "..." : "✓ Approve"}
                        </button>
                        <button
                          onClick={() => handleAction(r.id, "rejected")}
                          disabled={processing === r.id}
                          className="flex-1 py-2.5 font-mono text-xs font-bold rounded-lg border border-red-400/40 bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-all disabled:opacity-50">
                          {processing === r.id ? "..." : "✗ Reject"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminRequestsPage() {
  return (
    <Suspense fallback={<div className="font-mono text-text-muted p-8">Loading...</div>}>
      <AdminRequestsContent />
    </Suspense>
  );
}