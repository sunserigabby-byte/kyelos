"use client";

import { useEffect, useState } from "react";

// Eating window: 8 AM - 8 PM. Last-call warning between 7 PM and 8 PM.
const OPEN_HOUR = 8;
const CLOSE_HOUR = 20;
const WARN_HOUR = 19;

export default function EatingWindowBanner() {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const h = now.getHours();
  const m = now.getMinutes();
  const decimalHour = h + m / 60;

  let icon: string;
  let label: string;
  if (decimalHour < OPEN_HOUR) {
    icon = "🌅";
    label = "Eating window opens at 8 AM";
  } else if (decimalHour < WARN_HOUR) {
    const hoursLeft = Math.floor(CLOSE_HOUR - decimalHour);
    const minsLeft = Math.round(((CLOSE_HOUR - decimalHour) - hoursLeft) * 60);
    const left = hoursLeft > 0
      ? `${hoursLeft}h${minsLeft > 0 ? ` ${minsLeft}m` : ""}`
      : `${minsLeft}m`;
    icon = "🍽";
    label = `Eating window: 8 AM – 8 PM · ${left} left`;
  } else if (decimalHour < CLOSE_HOUR) {
    const minsLeft = Math.max(0, Math.round((CLOSE_HOUR - decimalHour) * 60));
    icon = "⏰";
    label = `Kitchen closes in ${minsLeft} min — last meal time`;
  } else {
    icon = "🌙";
    label = "Kitchen closed — water/tea only until tomorrow";
  }

  return (
    <div className="bg-forest text-cream rounded-md px-3 py-2 mb-3 text-sm flex items-center gap-2">
      <span className="text-base flex-shrink-0">{icon}</span>
      <span className="font-medium tracking-tight">{label}</span>
    </div>
  );
}
