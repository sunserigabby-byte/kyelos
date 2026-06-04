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
  const { person, setPerson } = useProfile();
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
          <div className="flex gap-1 bg-forest-light rounded-full p-1">
            <button
              onClick={() => setPerson("gabby")}
              className={`tappable px-4 py-1.5 text-sm rounded-full transition ${
                person === "gabby" ? "bg-terracotta text-cream font-medium" : "text-cream/70"
              }`}
            >
              Gabby
            </button>
            <button
              onClick={() => setPerson("jon")}
              className={`tappable px-4 py-1.5 text-sm rounded-full transition ${
                person === "jon" ? "bg-terracotta text-cream font-medium" : "text-cream/70"
              }`}
            >
              Jon
            </button>
          </div>
        </div>
        <nav className="flex gap-5 text-sm">
          <Link
            href="/"
            className={`pb-1 transition ${pathname === "/" ? "border-b-2 border-terracotta text-cream" : "text-cream/60"}`}
          >
            Today
          </Link>
          <Link
            href="/food"
            className={`pb-1 transition ${pathname === "/food" ? "border-b-2 border-terracotta text-cream" : "text-cream/60"}`}
          >
            Food
          </Link>
          {person === "gabby" && (
            <Link
              href="/cycle"
              className={`pb-1 transition ${pathname === "/cycle" ? "border-b-2 border-terracotta text-cream" : "text-cream/60"}`}
            >
              Cycle
            </Link>
          )}
          <Link
            href="/progress"
            className={`pb-1 transition ${pathname === "/progress" ? "border-b-2 border-terracotta text-cream" : "text-cream/60"}`}
          >
            Progress
          </Link>
          <Link
            href="/workout-history"
            className={`pb-1 transition ${pathname === "/workout-history" ? "border-b-2 border-terracotta text-cream" : "text-cream/60"}`}
          >
            Lifts
          </Link>
          <Link
            href="/phases"
            className={`pb-1 transition ${pathname === "/phases" ? "border-b-2 border-terracotta text-cream" : "text-cream/60"}`}
          >
            Phases
          </Link>
          <Link
            href="/goals"
            className={`pb-1 transition ${pathname.startsWith("/goals") ? "border-b-2 border-terracotta text-cream" : "text-cream/60"}`}
          >
            Goals
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
