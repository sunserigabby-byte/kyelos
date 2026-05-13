"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import {
  JON_WEEKLY_TREAT_BUDGET,
  phaseDayForDate,
  phaseDayToWeek,
  treatQuickAdds,
  type TreatCategory,
} from "@/lib/treat-options";

type TreatRow = {
  id: string;
  logged_date: string;
  week_num: number;
  treat_name: string;
  estimated_calories: number;
  category: TreatCategory | null;
};

function vibrate(p: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(p);
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function displayShort(iso: string): string {
  const [_y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}`;
}

export default function TreatTracker() {
  const { person } = useProfile();
  const { activePhase } = usePhase();
  const [allTreats, setAllTreats] = useState<TreatRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  if (!activePhase) return null;

  const todayIso = isoDate(new Date());
  const todayDay = phaseDayForDate(activePhase.start_date, todayIso);
  const currentWeek = phaseDayToWeek(todayDay);

  useEffect(() => {
    if (!activePhase) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("treat_logs")
        .select("id, logged_date, week_num, treat_name, estimated_calories, category")
        .eq("person", person)
        .eq("phase_id", activePhase.id)
        .order("logged_date", { ascending: false });
      if (cancelled) return;
      setAllTreats((data as TreatRow[]) ?? []);
    })();

    const channel = supabase
      .channel(`treats_${person}_${activePhase.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "treat_logs", filter: `person=eq.${person}` },
        async () => {
          const { data } = await supabase
            .from("treat_logs")
            .select("id, logged_date, week_num, treat_name, estimated_calories, category")
            .eq("person", person)
            .eq("phase_id", activePhase.id)
            .order("logged_date", { ascending: false });
          if (!cancelled) setAllTreats((data as TreatRow[]) ?? []);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [person, activePhase.id]);

  const thisWeek = useMemo(
    () => allTreats.filter((t) => t.week_num === currentWeek),
    [allTreats, currentWeek]
  );

  const usedCals = thisWeek.reduce((sum, t) => sum + t.estimated_calories, 0);
  const pct = Math.min(150, Math.round((usedCals / JON_WEEKLY_TREAT_BUDGET) * 100));

  // Week date range: first day of phase week
  const weekStartDay = (currentWeek - 1) * 7 + 1;
  const weekEndDay = currentWeek * 7;
  function dateForDay(day: number): string {
    const [sy, sm, sd] = activePhase!.start_date.split("-").map(Number);
    const d = new Date(Date.UTC(sy, sm - 1, sd));
    d.setUTCDate(d.getUTCDate() + (day - 1));
    return isoDate(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  const weekRange = `${displayShort(dateForDay(weekStartDay))}–${displayShort(dateForDay(weekEndDay))}`;

  let barColor: string;
  let statusText: string;
  if (pct < 50) {
    barColor = "#6B7A60"; // green sage
    statusText = "On track";
  } else if (pct < 75) {
    barColor = "#C7A85A"; // warm amber
    const daysLeft = 7 - ((todayDay - 1) % 7);
    statusText = `Halfway used, ${daysLeft} day${daysLeft === 1 ? "" : "s"} left this week`;
  } else if (pct < 100) {
    barColor = "#A85E40"; // terracotta dark
    statusText = "Approaching limit";
  } else {
    barColor = "#8B3A2D"; // deep red
    statusText = `Over budget by ${usedCals - JON_WEEKLY_TREAT_BUDGET} cal`;
  }

  async function logTreat(name: string, calories: number, category?: TreatCategory) {
    if (!activePhase) return;
    vibrate(8);
    await supabase.from("treat_logs").insert({
      person,
      phase_id: activePhase.id,
      logged_date: todayIso,
      week_num: currentWeek,
      treat_name: name,
      estimated_calories: calories,
      category: category ?? null,
    });
    setModalOpen(false);
  }

  async function deleteTreat(id: string) {
    vibrate(5);
    await supabase.from("treat_logs").delete().eq("id", id);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="flex items-baseline justify-between mb-1">
        <div className="font-bold text-charcoal text-base">🎯 Treat Budget</div>
        <div className="text-xs text-charcoal/60">Week {currentWeek} · {weekRange}</div>
      </div>

      <div className="text-sm text-charcoal mb-2">
        Used: <span className="font-bold">{usedCals}</span>
        <span className="text-gray-500"> / {JON_WEEKLY_TREAT_BUDGET} cal</span>
      </div>

      <div className="h-3 bg-forest-pale rounded-full overflow-hidden mb-1">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${Math.min(100, pct)}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      <div className="text-xs italic mb-3" style={{ color: barColor }}>
        {statusText}
      </div>

      <button
        onClick={() => setModalOpen(true)}
        className="tappable w-full bg-terracotta text-cream font-semibold py-2.5 rounded-md text-sm mb-3"
      >
        + Log a treat
      </button>

      <div className="text-[10px] uppercase tracking-wider text-charcoal/60 font-semibold mb-1">
        This week's treats
      </div>
      {thisWeek.length === 0 ? (
        <p className="text-xs text-gray-500 italic">
          No treats logged this week. Use your budget when you want to.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {thisWeek.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="text-charcoal truncate">{t.treat_name}</div>
                <div className="text-[11px] text-gray-500">
                  {displayShort(t.logged_date)} · {t.estimated_calories} cal
                </div>
              </div>
              <button
                onClick={() => deleteTreat(t.id)}
                className="tappable text-gray-400 hover:text-red-700 text-sm px-2"
                aria-label="Delete treat"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <LogModal
          onLog={logTreat}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function LogModal({
  onLog,
  onClose,
}: {
  onLog: (name: string, cal: number, cat?: TreatCategory) => void;
  onClose: () => void;
}) {
  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState("");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-2xl max-h-[85vh] flex flex-col fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-2 border-b border-gray-200 flex items-start justify-between">
          <div className="font-bold text-charcoal">Log a treat</div>
          <button onClick={onClose} className="tappable text-gray-400 px-2">✕</button>
        </div>

        <div className="p-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {treatQuickAdds.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onLog(opt.name, opt.calories, opt.category)}
                className="tappable bg-forest-pale border border-forest/30 rounded-md p-3 text-left"
              >
                <div className="text-xl mb-0.5">{opt.emoji}</div>
                <div className="text-xs font-semibold text-charcoal">{opt.name}</div>
                <div className="text-[10px] text-charcoal/60">{opt.calories} cal</div>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="text-xs font-bold text-charcoal mb-2">✍️ Custom</div>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Treat name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-forest focus:outline-none"
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="cal"
                value={customCal}
                onChange={(e) => setCustomCal(e.target.value.replace(/[^\d]/g, ""))}
                className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm text-right focus:border-forest focus:outline-none"
              />
            </div>
            <button
              onClick={() => {
                const n = parseInt(customCal, 10);
                if (customName.trim() && Number.isFinite(n) && n > 0) {
                  onLog(customName.trim(), n);
                  setCustomName("");
                  setCustomCal("");
                }
              }}
              disabled={!customName.trim() || !customCal}
              className="tappable w-full bg-terracotta text-cream font-semibold py-2.5 rounded-md text-sm disabled:opacity-50"
            >
              Save custom treat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
