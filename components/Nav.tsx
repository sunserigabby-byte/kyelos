"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "./ProfileContext";
import { usePhase } from "./PhaseContext";
import { useLiveStatus } from "./useLiveStatus";
import { getCurrentPhaseDay } from "@/lib/phases";

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KyelosMark() {
  // Two asymmetric peaks (Gabby + Jon) with a shared sun above the meeting point.
  // Peaks fill = cream (currentColor), sun = terracotta.
  return (
    <svg width="32" height="20" viewBox="0 0 44 44" className="text-cream flex-shrink-0" aria-hidden="true">
      <circle cx="22" cy="11" r="5" fill="#C7785A" />
      <path d="M 2 38 L 14 24 L 22 30 L 30 8 L 42 38 Z" fill="currentColor" />
    </svg>
  );
}

export default function Nav() {
  const { view, setView } = useProfile();
  const { activePhase } = usePhase();
  const pathname = usePathname();
  const { isConnected } = useLiveStatus();

  const vacationPill =
    activePhase?.phase_type === "vacation"
      ? `🌴 PR Day ${getCurrentPhaseDay(activePhase, new Date())}`
      : null;

  return (
    <header className="bg-forest text-cream sticky top-0 z-50 shadow-md safe-top">
      <div className="max-w-2xl mx-auto px-4 pb-3 pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <KyelosMark />
            <span className="font-display text-2xl font-medium tracking-tight flex-shrink-0">
              Kyelos
            </span>
            {vacationPill && (
              <span className="bg-terracotta text-cream text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0">
                {vacationPill}
              </span>
            )}
            {isConnected && (
              <span className="live-pulse flex items-center gap-1 text-[10px] text-cream/70 flex-shrink-0">
                <span className="w-1.5 h-1.5 bg-cream rounded-full"></span>
                LIVE
              </span>
            )}
          </div>
          <div className="flex gap-0.5 bg-forest-light rounded-full p-1">
            <button
              onClick={() => setView("gabby")}
              className={`tappable px-3 py-1.5 text-xs sm:text-sm rounded-full transition ${
                view === "gabby" ? "bg-terracotta text-cream font-medium" : "text-cream/70"
              }`}
            >
              Gabby
            </button>
            <button
              onClick={() => setView("jon")}
              className={`tappable px-3 py-1.5 text-xs sm:text-sm rounded-full transition ${
                view === "jon" ? "bg-terracotta text-cream font-medium" : "text-cream/70"
              }`}
            >
              Jon
            </button>
            <button
              onClick={() => setView("together")}
              className={`tappable px-3 py-1.5 text-xs sm:text-sm rounded-full transition ${
                view === "together" ? "bg-terracotta text-cream font-medium" : "text-cream/70"
              }`}
            >
              Us
            </button>
          </div>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link
            href="/"
            className={`pb-1 transition ${pathname === "/" ? "border-b-2 border-terracotta text-cream" : "text-cream/60"}`}
          >
            Today
          </Link>
          <Link
            href="/plan"
            className={`pb-1 transition ${pathname.startsWith("/plan") ? "border-b-2 border-terracotta text-cream" : "text-cream/60"}`}
          >
            Plan
          </Link>
          <Link
            href="/fitness"
            className={`pb-1 transition ${
              pathname.startsWith("/fitness") ||
              pathname.startsWith("/workout-history") ||
              pathname.startsWith("/phases") ||
              pathname.startsWith("/progress")
                ? "border-b-2 border-terracotta text-cream"
                : "text-cream/60"
            }`}
          >
            Fitness
          </Link>
          <Link
            href="/finances"
            className={`pb-1 transition ${
              pathname.startsWith("/finances") || pathname.startsWith("/goals")
                ? "border-b-2 border-terracotta text-cream"
                : "text-cream/60"
            }`}
          >
            Finances
          </Link>
          <Link
            href="/settings"
            className={`pb-1 transition ml-auto ${pathname === "/settings" ? "border-b-2 border-terracotta text-cream" : "text-cream/60"}`}
            aria-label="Settings"
          >
            <GearIcon />
          </Link>
        </nav>
      </div>
    </header>
  );
}
