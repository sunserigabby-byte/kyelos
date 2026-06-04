"use client";

import { useEffect, useState } from "react";
import { todayLocalISO, displayShort, daysSince } from "@/lib/local-date";

type Props = {
  /** Optional goal/phase start date for "Day N of …" suffix. */
  startISO?: string;
  /** Optional label to follow Day N, e.g. "of goal" or "of plan". */
  context?: string;
};

// Re-renders at midnight so the displayed date stays correct
// without requiring a page reload.
export default function TodayBadge({ startISO, context }: Props) {
  const [iso, setIso] = useState<string>(() => todayLocalISO());

  useEffect(() => {
    function scheduleNextTick() {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      const delay = next.getTime() - now.getTime();
      const id = setTimeout(() => {
        setIso(todayLocalISO());
        scheduleNextTick();
      }, delay);
      return id;
    }
    const id = scheduleNextTick();
    // Also re-check on visibility / focus in case the tab was sleeping.
    const onFocus = () => setIso(todayLocalISO());
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearTimeout(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const dayN = startISO ? daysSince(startISO) : null;

  return (
    <div className="inline-flex items-center gap-2 bg-forest-pale border border-terracotta/30 text-charcoal rounded-full px-3 py-1 mb-3 text-[11px] font-bold tracking-wider uppercase">
      <span className="text-terracotta">TODAY</span>
      <span>·</span>
      <span>{displayShort(iso)}</span>
      {dayN !== null && dayN > 0 && (
        <>
          <span>·</span>
          <span>Day {dayN}{context ? ` of ${context}` : ""}</span>
        </>
      )}
    </div>
  );
}
