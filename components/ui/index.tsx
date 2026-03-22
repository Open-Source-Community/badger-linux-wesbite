import { type ReactNode } from "react";
import clsx from "clsx";

// ─── Badge Pill ───────────────────────────────────────────────────────────────
interface BadgePillProps {
  icon: string;
  name: string;
  points: number;
  earned?: boolean;
  size?: "sm" | "md" | "lg";
}
export function BadgePill({ icon, name, points, earned = false, size = "md" }: BadgePillProps) {
  return (
    <span className={clsx(
      "inline-flex items-center gap-2 rounded-md font-mono font-medium border transition-all",
      size === "sm" && "px-2.5 py-1 text-xs",
      size === "md" && "px-3.5 py-2 text-sm",
      size === "lg" && "px-4 py-2.5 text-base",
      earned
        ? "bg-accent/10 border-accent/30 text-accent drop-shadow-[0_0_8px_rgba(57,211,83,0.2)]"
        : "bg-white/[0.02] border-white/[0.06] text-text-dim"
    )}>
      <span className={size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg"}>{icon}</span>
      <span>{name}</span>
      <span className={clsx("text-[11px]", earned ? "text-accent-dim" : "text-text-muted")}>+{points}pts</span>
    </span>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
export function StatusPill({ status }: { status: "pending" | "approved" | "rejected" }) {
  return (
    <span className={clsx(
      "font-mono text-xs font-semibold px-2 py-0.5 rounded border",
      status === "pending" && "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
      status === "approved" && "text-accent border-accent/40 bg-accent/10",
      status === "rejected" && "text-red-400 border-red-400/40 bg-red-400/10",
    )}>
      {status}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
// export function Card({ children, className }: { children: ReactNode; className?: string }) {
//   return (
//     <div className={clsx("bg-card border border-border rounded-xl", className)}>
//       {children}
//     </div>
//   );
// }
// interface CardProps {
//   children: ReactNode;
//   className?: string;
//   style?: React.CSSProperties;
// }
export function Card({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={clsx("bg-card border border-border rounded-xl", className)} style={style}>
      {children}
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-xs text-text-muted tracking-widest mb-4 uppercase">
      // {children}
    </p>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, photoURL, size = 40 }: { name: string; photoURL?: string | null; size?: number }) {
  const initial = name?.charAt(0)?.toUpperCase() ?? "?";
  if (photoURL) {
    return (
      <img src={photoURL} alt={name} width={size} height={size}
        className="rounded-full border border-border object-cover shrink-0"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div
      className="rounded-full border border-border flex items-center justify-center font-mono font-bold shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.4,
        background: "linear-gradient(135deg, #2a9e3e, #1a5c2a)",
        color: "#0a0e0a",
      }}>
      {initial}
    </div>
  );
}

// ─── Terminal Box ─────────────────────────────────────────────────────────────
export function Terminal({ lines }: { lines: string[] }) {
  return (
    <div className="bg-[#060a06] border border-border rounded-lg p-4 font-mono text-xs">
      <div className="flex gap-1.5 mb-3">
        {["#e05252", "#f0c040", "#39d353"].map(c => (
          <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
        ))}
      </div>
      {lines.map((line, i) => (
        <div key={i} className={clsx("leading-relaxed",
          line.startsWith("$") ? "text-accent" : line.startsWith("#") ? "text-text-dim" : "text-text-base"
        )}>
          {line || <>&nbsp;</>}
        </div>
      ))}
      <span className="text-accent cursor-blink">█</span>
    </div>
  );
}

// ─── Category badge ───────────────────────────────────────────────────────────
export function CategoryTag({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[11px] px-2 py-0.5 rounded border border-accent-dim/40 bg-accent-dim/10 text-accent-dim">
      {children}
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="text-center py-16 font-mono text-text-muted">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Loading spinner ──────────────────────────────────────────────────────────
export function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1 py-12">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-2 h-2 rounded-full bg-accent-dim animate-pulse"
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}
