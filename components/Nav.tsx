"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "./ProfileContext";
import { useLiveStatus } from "./useLiveStatus";

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

export default function Nav() {
  const { person, setPerson } = useProfile();
  const pathname = usePathname();
  const { isConnected } = useLiveStatus();

  return (
    <div className="bg-navy text-white sticky top-0 z-50 shadow-md safe-top">
      <div className="max-w-2xl mx-auto px-4 pb-3 pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-gold font-bold tracking-widest text-xs">PR CUT TRACKER</h1>
            {isConnected && (
              <span className="live-pulse flex items-center gap-1 text-[10px] text-gold/80">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                LIVE
              </span>
            )}
          </div>
          <div className="flex gap-1 bg-navy-dark rounded-full p-1">
            <button
              onClick={() => setPerson("gabby")}
              className={`tappable px-4 py-1.5 text-sm rounded-full transition ${
                person === "gabby" ? "bg-gold text-navy font-semibold" : "text-white/70"
              }`}
            >
              Gabby
            </button>
            <button
              onClick={() => setPerson("jon")}
              className={`tappable px-4 py-1.5 text-sm rounded-full transition ${
                person === "jon" ? "bg-gold text-navy font-semibold" : "text-white/70"
              }`}
            >
              Jon
            </button>
          </div>
        </div>
        <div className="flex gap-5 text-sm">
          <Link
            href="/"
            className={`pb-1 transition ${pathname === "/" ? "border-b-2 border-gold text-white" : "text-white/60"}`}
          >
            Today
          </Link>
          <Link
            href="/food"
            className={`pb-1 transition ${pathname === "/food" ? "border-b-2 border-gold text-white" : "text-white/60"}`}
          >
            Food
          </Link>
          {person === "gabby" && (
            <Link
              href="/cycle"
              className={`pb-1 transition ${pathname === "/cycle" ? "border-b-2 border-gold text-white" : "text-white/60"}`}
            >
              Cycle
            </Link>
          )}
          <Link
            href="/progress"
            className={`pb-1 transition ${pathname === "/progress" ? "border-b-2 border-gold text-white" : "text-white/60"}`}
          >
            Progress
          </Link>
          <Link
            href="/settings"
            className={`pb-1 transition ml-auto ${pathname === "/settings" ? "border-b-2 border-gold text-white" : "text-white/60"}`}
            aria-label="Settings"
          >
            <GearIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}
