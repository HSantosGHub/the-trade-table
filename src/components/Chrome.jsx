import React from "react";
import { ArrowLeft, User, BarChart3, LayoutGrid } from "lucide-react";

export function Logo({ size = 30, color = "#F2E8DE" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 500 500">
      <circle cx="250" cy="250" r="215" fill="none" stroke={color} strokeWidth="10" />
      <circle cx="250" cy="250" r="198" fill="none" stroke={color} strokeWidth="20" />
      <text x="250" y="243" textAnchor="middle" fontFamily="'Fraunces', serif" fontWeight="600" fontSize="40" fill={color}>THE TRADE</text>
      <text x="250" y="298" textAnchor="middle" fontFamily="'Fraunces', serif" fontWeight="600" fontSize="40" fill={color}>TABLE</text>
    </svg>
  );
}

export function Header({ title, onBack, right, showLogo }) {
  return (
    <div
      className="sticky top-0 z-20 flex items-center justify-between px-4 pb-3 border-b bg-deeprust border-ink"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
    >
      <div className="flex items-center gap-2.5">
        {onBack && (
          <button onClick={onBack} className="p-1 -ml-1 text-paper">
            <ArrowLeft size={20} />
          </button>
        )}
        {showLogo && <Logo size={28} />}
        <h1 className="text-xl tracking-wide font-display text-paper">{title}</h1>
      </div>
      {right}
    </div>
  );
}

export function BottomNav({ tab, setTab }) {
  const items = [
    { key: "inventory", label: "Inventory", icon: LayoutGrid },
    { key: "buyers", label: "Buyers", icon: User },
    { key: "metrics", label: "Metrics", icon: BarChart3 },
  ];
  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex border-t bg-ink border-black"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {items.map(({ key, label, icon: Icon }) => {
        const active = tab === key;
        return (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5"
            style={{ color: active ? "#D98255" : "#8A8577" }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] tracking-wide font-mono">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* Staleness -> a shelf tag that visually sun-fades the longer an item sits. */
export function stalenessInfo(days) {
  if (days <= 14) return { bg: "#B54A2C", fg: "#F2E8DE", label: "Fresh" };
  if (days <= 60) return { bg: "#C0805E", fg: "#2B211C", label: `${days}d` };
  if (days <= 120) return { bg: "#BFA48C", fg: "#3a2f1f", label: `${days}d` };
  return { bg: "#A99A88", fg: "#33301f", label: `${days}d — stale` };
}

export function ShelfTag({ days }) {
  const s = stalenessInfo(days);
  return (
    <div
      className="absolute -top-2 -right-2 flex flex-col items-center"
      style={{
        filter: `saturate(${1 - Math.min(days / 300, 0.6)}) sepia(${Math.min(days / 400, 0.35)})`,
      }}
    >
      <div className="w-3 h-3 rounded-full border border-black/20 -mb-1 z-10" style={{ background: "#8B8B7A" }} />
      <div
        className="px-2 py-1 text-[10px] font-bold rotate-3 shadow-sm border border-black/10 font-mono"
        style={{
          background: s.bg,
          color: s.fg,
          clipPath: "polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)",
          paddingRight: "10px",
        }}
      >
        {s.label}
      </div>
    </div>
  );
}

export function daysSince(dateStr) {
  const then = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

// Formats a "YYYY-MM-DD" date string using its literal year/month/day,
// instead of letting JS parse it as UTC midnight and shift it a day
// backward in timezones behind UTC.
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}
