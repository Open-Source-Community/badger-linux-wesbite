"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Card, SectionLabel } from "@/components/ui";
import type { Season, Badge } from "@/types";

const PRESET_COLORS = [
  "#39d353", "#4a9eff", "#f0c040", "#e05252",
  "#a78bfa", "#f97316", "#06b6d4", "#ec4899",
  "#84cc16", "#14b8a6",
];

// ── Badge icon display ────────────────────────────────────────────────────────
function BadgeIcon({ badge, size = 40 }: { badge: Badge; size?: number }) {
  if (badge.imageURL) {
    return (
      <img src={badge.imageURL} alt={badge.name}
        className="rounded-lg object-cover shrink-0"
        style={{ width: size, height: size, border: `2px solid ${badge.color}40` }} />
    );
  }
  return (
    <div className="rounded-lg flex items-center justify-center shrink-0 text-2xl"
      style={{ width: size, height: size, background: `${badge.color}20`, border: `2px solid ${badge.color}40` }}>
      {badge.icon}
    </div>
  );
}

export default function AdminSeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  // Season form
  const [seasonName, setSeasonName] = useState("");
  const [setActive, setSetActive] = useState(false);
  const [seasonLoading, setSeasonLoading] = useState(false);

  // Badge form
  const emptyBadge = { name: "", icon: "🐧", description: "", points: "", category: "", color: "#39d353" };
  const [badgeForm, setBadgeForm] = useState(emptyBadge);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [badgeLoading, setBadgeLoading] = useState(false);
  const [badgeSuccess, setBadgeSuccess] = useState(false);
  const [badgeError, setBadgeError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Activate
  const [activating, setActivating] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [sRes, bRes] = await Promise.all([
      fetch("/api/admin/seasons"),
      fetch("/api/badges"),
    ]);
    const [sData, bData] = await Promise.all([sRes.json(), bRes.json()]);
    const fetchedSeasons: Season[] = sData.seasons ?? [];
    setSeasons(fetchedSeasons);
    setBadges(bData.badges ?? []);
    if (fetchedSeasons.length > 0 && !selectedSeason) {
      const active = fetchedSeasons.find(s => s.isActive);
      setSelectedSeason(active?.id ?? fetchedSeasons[0].id);
    }
    setLoading(false);
  }, [selectedSeason]);

  useEffect(() => { fetchData(); }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setBadgeError("Image must be under 2MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setBadgeError("");
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreateSeason = async () => {
    if (!seasonName.trim()) return;
    setSeasonLoading(true);
    const res = await fetch("/api/admin/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: seasonName.trim(), setActive }),
    });
    if (res.ok) {
      setSeasonName("");
      setSetActive(false);
      await fetchData();
    }
    setSeasonLoading(false);
  };

  const handleActivateSeason = async (seasonId: string) => {
    setActivating(seasonId);
    await fetch("/api/admin/seasons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seasonId }),
    });
    await fetchData();
    setActivating(null);
  };

  const handleCreateBadge = async () => {
    setBadgeError("");
    if (!selectedSeason || !badgeForm.name || !badgeForm.icon || !badgeForm.description || !badgeForm.points || !badgeForm.category || !badgeForm.color) {
      setBadgeError("All fields are required");
      return;
    }

    setBadgeLoading(true);

    // Use FormData to support file upload
    const fd = new FormData();
    fd.append("seasonId", selectedSeason);
    fd.append("name", badgeForm.name);
    fd.append("icon", badgeForm.icon);
    fd.append("description", badgeForm.description);
    fd.append("points", badgeForm.points);
    fd.append("category", badgeForm.category);
    fd.append("color", badgeForm.color);
    if (imageFile) fd.append("image", imageFile);

    const res = await fetch("/api/badges", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      setBadgeError(data.error ?? "Failed to create badge");
      setBadgeLoading(false);
      return;
    }

    setBadgeForm(emptyBadge);
    clearImage();
    setBadgeSuccess(true);
    setTimeout(() => setBadgeSuccess(false), 3000);
    await fetchData();
    setBadgeLoading(false);
  };

  const seasonBadges = badges.filter(b => b.seasonId === selectedSeason);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <Link href="/admin" className="font-mono text-xs text-text-muted hover:text-accent transition-colors">
          ← Dashboard
        </Link>
        <div>
          <p className="font-mono text-xs text-yellow-400 tracking-widest mb-0.5">⚡ ADMIN PANEL</p>
          <h1 className="font-mono font-bold text-2xl text-text-base">Seasons & Badges</h1>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Left: Seasons ─────────────────────────────────── */}
        <div>
          <SectionLabel>Seasons</SectionLabel>

          <Card className="p-5 mb-4">
            <h2 className="font-mono text-sm font-semibold text-text-base mb-4">Create New Season</h2>
            <input value={seasonName} onChange={e => setSeasonName(e.target.value)}
              placeholder="e.g. Fall 2025"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 font-mono text-sm text-text-base outline-none focus:border-accent/40 transition-colors mb-3 placeholder:text-text-muted" />
            <label className="flex items-center gap-2 font-mono text-xs text-text-dim cursor-pointer mb-4">
              <input type="checkbox" checked={setActive} onChange={e => setSetActive(e.target.checked)} className="accent-accent" />
              Set as active season immediately
            </label>
            <button onClick={handleCreateSeason} disabled={!seasonName.trim() || seasonLoading}
              className="w-full py-2.5 font-mono text-xs font-bold rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all disabled:opacity-40">
              {seasonLoading ? "Creating..." : "+ Create Season"}
            </button>
          </Card>

          <div className="space-y-2">
            {seasons.map(s => (
              <div key={s.id} onClick={() => setSelectedSeason(s.id)} className="cursor-pointer">
                <Card className={`p-4 flex items-center justify-between transition-all ${
                  selectedSeason === s.id ? "border-accent/40 bg-accent/5" : "hover:border-accent/20"
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-semibold text-text-base">{s.name}</p>
                      {s.isActive && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-accent/15 border border-accent/30 text-accent">ACTIVE</span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-text-muted mt-0.5">
                      {badges.filter(b => b.seasonId === s.id).length} badges
                    </p>
                  </div>
                  {!s.isActive && (
                    <button onClick={e => { e.stopPropagation(); handleActivateSeason(s.id); }}
                      disabled={activating === s.id}
                      className="font-mono text-xs text-yellow-400 border border-yellow-400/30 px-3 py-1.5 rounded-lg hover:bg-yellow-400/10 transition-all disabled:opacity-50">
                      {activating === s.id ? "..." : "Activate"}
                    </button>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Badge form ──────────────────────────────── */}
        <div>
          <SectionLabel>
            {selectedSeason ? `Badges — ${seasons.find(s => s.id === selectedSeason)?.name ?? ""}` : "Select a season"}
          </SectionLabel>

          {selectedSeason && (
            <>
              <Card className="p-5 mb-4">
                <h2 className="font-mono text-sm font-semibold text-text-base mb-5">Add New Badge</h2>

                {/* Name */}
                <div className="mb-4">
                  <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">Badge Name *</label>
                  <input value={badgeForm.name} onChange={e => setBadgeForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Kernel Hacker"
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-base outline-none focus:border-accent/40 transition-colors placeholder:text-text-muted" />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">Description *</label>
                  <textarea value={badgeForm.description} onChange={e => setBadgeForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What should the member do to earn this badge?"
                    rows={3}
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-base outline-none focus:border-accent/40 transition-colors resize-none placeholder:text-text-muted" />
                </div>

                {/* Category + Points */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">Category *</label>
                    <input value={badgeForm.category} onChange={e => setBadgeForm(f => ({ ...f, category: e.target.value }))}
                      placeholder="e.g. Skills"
                      className="w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-base outline-none focus:border-accent/40 transition-colors placeholder:text-text-muted" />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">Points *</label>
                    <input value={badgeForm.points} onChange={e => setBadgeForm(f => ({ ...f, points: e.target.value }))}
                      placeholder="e.g. 30" type="number" min="1"
                      className="w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-base outline-none focus:border-accent/40 transition-colors placeholder:text-text-muted" />
                  </div>
                </div>

                {/* Emoji icon */}
                <div className="mb-4">
                  <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">Emoji Icon *</label>
                  <input value={badgeForm.icon} onChange={e => setBadgeForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="🐧"
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-base outline-none focus:border-accent/40 transition-colors placeholder:text-text-muted" />
                </div>

                {/* Badge color */}
                <div className="mb-4">
                  <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">Badge Color *</label>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2 flex-wrap flex-1">
                      {PRESET_COLORS.map(c => (
                        <button key={c} onClick={() => setBadgeForm(f => ({ ...f, color: c }))}
                          className="w-7 h-7 rounded-full border-2 transition-all"
                          style={{
                            background: c,
                            borderColor: badgeForm.color === c ? "white" : "transparent",
                            boxShadow: badgeForm.color === c ? `0 0 8px ${c}` : "none",
                          }} />
                      ))}
                    </div>
                    {/* Custom color picker */}
                    <div className="relative">
                      <input type="color" value={badgeForm.color}
                        onChange={e => setBadgeForm(f => ({ ...f, color: e.target.value }))}
                        className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent" />
                    </div>
                    <span className="font-mono text-xs text-text-dim">{badgeForm.color}</span>
                  </div>
                </div>

                {/* Image upload */}
                <div className="mb-5">
                  <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">
                    Badge Image (optional — overrides emoji display)
                  </label>
                  <div className="flex items-center gap-3">
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="preview"
                          className="w-16 h-16 rounded-lg object-cover border border-border" />
                        <button onClick={clearImage}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center text-2xl"
                        style={{ background: `${badgeForm.color}10` }}>
                        {badgeForm.icon}
                      </div>
                    )}
                    <div className="flex-1">
                      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleImageChange} className="hidden" id="badge-image" />
                      <label htmlFor="badge-image"
                        className="block font-mono text-xs text-accent border border-accent/30 bg-accent/10 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent/20 transition-all text-center">
                        {imageFile ? "Change image" : "Upload PNG / JPG / WebP"}
                      </label>
                      <p className="font-mono text-[10px] text-text-muted mt-1 text-center">Max 2MB</p>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="mb-5 p-4 rounded-lg border border-border"
                  style={{ background: `${badgeForm.color}08` }}>
                  <p className="font-mono text-[10px] text-text-muted mb-3 tracking-wider uppercase">Preview</p>
                  <div className="flex items-center gap-3">
                    {imagePreview ? (
                      <img src={imagePreview} className="w-12 h-12 rounded-lg object-cover"
                        style={{ border: `2px solid ${badgeForm.color}50` }} />
                    ) : (
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ background: `${badgeForm.color}20`, border: `2px solid ${badgeForm.color}40` }}>
                        {badgeForm.icon}
                      </div>
                    )}
                    <div>
                      <p className="font-mono text-sm font-bold" style={{ color: badgeForm.color }}>
                        {badgeForm.name || "Badge Name"}
                      </p>
                      <p className="font-mono text-xs text-text-dim">
                        {badgeForm.category || "Category"} · {badgeForm.points || "0"}pts
                      </p>
                    </div>
                  </div>
                </div>

                {badgeError && <p className="font-mono text-xs text-red-400 mb-3">{badgeError}</p>}
                {badgeSuccess && <p className="font-mono text-xs text-accent mb-3">✓ Badge created successfully!</p>}

                <button onClick={handleCreateBadge} disabled={badgeLoading}
                  className="w-full py-3 font-mono text-sm font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "#39d353", color: "#0a0e0a", boxShadow: "0 0 16px rgba(57,211,83,0.2)" }}>
                  {badgeLoading ? "Creating..." : `+ Add Badge to ${seasons.find(s => s.id === selectedSeason)?.name ?? "Season"}`}
                </button>
              </Card>

              {/* Existing badges */}
              {seasonBadges.length > 0 && (
                <div>
                  <p className="font-mono text-xs text-text-muted mb-3 tracking-wider">
                    {seasonBadges.length} BADGE{seasonBadges.length !== 1 ? "S" : ""} IN THIS SEASON
                  </p>
                  <div className="space-y-2">
                    {seasonBadges.map(b => (
                      <Card key={b.id} className="flex items-center gap-3 p-3">
                        <BadgeIcon badge={b} size={44} />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm font-semibold" style={{ color: b.color }}>{b.name}</p>
                          <p className="font-sans text-xs text-text-dim truncate">{b.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="font-mono text-xs text-text-muted border border-border px-2 py-0.5 rounded">
                            {b.category}
                          </span>
                          <span className="font-mono text-sm font-bold" style={{ color: b.color }}>{b.points}pts</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {seasonBadges.length === 0 && (
                <div className="text-center py-10 font-mono text-text-muted text-sm">
                  No badges in this season yet. Add one above!
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}