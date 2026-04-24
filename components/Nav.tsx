"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "./ProfileContext";
import { useLiveStatus } from "./useLiveStatus";

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
            href="/progress"
            className={`pb-1 transition ${pathname === "/progress" ? "border-b-2 border-gold text-white" : "text-white/60"}`}
          >
            Progress
          </Link>
        </div>
      </div>
    </div>
  );
}
