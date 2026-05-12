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

function TandemMark() {
  // Two interlocked rings — Gabby + Jon training in tandem.
  return (
    <svg width="28" height="15" viewBox="0 0 40 22" className="text-cream flex-shrink-0" aria-hidden="true">
      <circle cx="13" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="27" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
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
    <header className="bg-sage text-cream sticky top-0 z-50 shadow-md safe-top">
      <div className="max-w-2xl mx-auto px-4 pb-3 pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <TandemMark />
            <span className="font-display text-xl font-medium tracking-tight flex-shrink-0">
              Tandem
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
          <div className="flex gap-1 bg-sage-dark rounded-full p-1">
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
