"use client";

import { useState } from "react";
import type { Phase } from "@/lib/phases";

type Props = {
  phase: Phase;
  phaseNumber: number;     // e.g. 3 for "Phase 3"
  dayNum: number;
  totalDays: number;
};

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

export default function PhaseBanner({ phase, phaseNumber, dayNum, totalDays }: Props) {
  const [open, setOpen] = useState(false);
  const focusLabel = (phase as any).focus_label ?? "";
  const purposeText = (phase as any).purpose_text ?? "";

  return (
    <button
      onClick={() => setOpen((v) => !v)}
      className="tappable w-full text-left bg-navy text-white rounded-lg p-4 mb-3 border-t-4 border-b-4 border-gold"
    >
      <div className="text-gold text-[10px] font-bold tracking-widest mb-1">
        PHASE {phaseNumber} · DAY {dayNum} OF {totalDays}{focusLabel ? ` · ${focusLabel.toUpperCase()}` : ""}
      </div>
      <div className="text-lg font-bold">{phase.name}</div>
      {open && (
        <div className="mt-2 pt-2 border-t border-white/20 text-xs text-white/80 space-y-1">
          {purposeText && <div>{purposeText}</div>}
          <div className="text-gold/80">
            {fmtDate(phase.start_date)} – {fmtDate(phase.end_date)}
          </div>
        </div>
      )}
      <div className="mt-1 text-[10px] text-gold/60">
        {open ? "Tap to collapse" : "Tap to see purpose"}
      </div>
    </button>
  );
}
