"use client";

import { useEffect, useState } from "react";

type Props = {
  title: string;
  /** When true, section auto-collapses to a one-liner. User can still expand. */
  done?: boolean;
  /** Tiny summary shown next to the title when collapsed-and-done. */
  doneLabel?: string;
  children: React.ReactNode;
};

export default function CollapsibleSection({ title, done, doneLabel, children }: Props) {
  const [userOverride, setUserOverride] = useState<"open" | "closed" | null>(null);
  const [autoCollapsed, setAutoCollapsed] = useState(false);

  // Auto-collapse when `done` flips to true. Never auto-reopens.
  useEffect(() => {
    if (done) setAutoCollapsed(true);
  }, [done]);

  const collapsed = userOverride === "closed" ? true : userOverride === "open" ? false : autoCollapsed;

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setUserOverride(collapsed ? "open" : "closed")}
        className="tappable w-full text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3 flex items-center justify-between gap-2"
      >
        <span className="flex items-center gap-2 min-w-0">
          {done && <span className="text-emerald-600 flex-shrink-0">✓</span>}
          <span className="truncate">{title}</span>
          {done && doneLabel && collapsed && (
            <span className="text-[11px] font-normal italic text-charcoal/50 truncate">
              — {doneLabel}
            </span>
          )}
        </span>
        <span className="text-charcoal/40 text-xs flex-shrink-0">{collapsed ? "▼" : "▲"}</span>
      </button>
      {!collapsed && children}
    </div>
  );
}
