"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Person } from "@/lib/plan-data";
import { usePhase } from "@/components/PhaseContext";

type Props = {
  person: Person;
  dayNum: number;
  isoDate: string;
  totalDays: number;
};

function targetForDay(person: Person, dayNum: number, totalDays: number): number {
  // Travel day = last day of the protocol
  const isTravel = dayNum === totalDays;
  if (isTravel) return person === "gabby" ? 40 : 50;
  return person === "gabby" ? 128 : 160;
}

function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export default function HydrationCard({ person, dayNum, isoDate, totalDays }: Props) {
  const { activePhase } = usePhase();
  const phaseId = activePhase?.id;

  const [waterOz, setWaterOz] = useState(0);
  const target = targetForDay(person, dayNum, totalDays);
  const goalHitRef = useRef(false);

  useEffect(() => {
    setWaterOz(0);
    goalHitRef.current = false;
    if (!phaseId) return;

    let mounted = true;

    async function load() {
      const { data } = await supabase
        .from("daily_logs")
        .select("water_oz")
        .eq("person", person)
        .eq("day_num", dayNum)
        .eq("phase_id", phaseId)
        .maybeSingle();
      if (mounted) {
        const cur = (data as any)?.water_oz ?? 0;
        setWaterOz(cur);
        goalHitRef.current = cur >= target;
      }
    }
    load();

    const channel = supabase
      .channel(`water_${person}_${dayNum}_${phaseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_logs",
          filter: `person=eq.${person}`,
        },
        (payload) => {
          if (!mounted) return;
          const row: any = payload.new || payload.old;
          if (row && row.day_num === dayNum && row.phase_id === phaseId) {
            const newAmt = (payload.new as any)?.water_oz ?? 0;
            setWaterOz(newAmt);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [person, dayNum, phaseId, target]);

  async function adjust(delta: number) {
    if (!phaseId) return;
    const next = Math.max(0, waterOz + delta);
    setWaterOz(next);

    if (next >= target && !goalHitRef.current) {
      goalHitRef.current = true;
      vibrate([20, 60, 20, 60, 20]);
    } else {
      vibrate(8);
    }

    await supabase.from("daily_logs").upsert(
      {
        person,
        day_num: dayNum,
        date: isoDate,
        phase_id: phaseId,
        water_oz: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "person,day_num,phase_id" }
    );
  }

  const pct = Math.min(100, Math.round((waterOz / target) * 100));
  const isTravel = dayNum === totalDays;
  const isPeakDay = dayNum === totalDays - 1; // Day 6 of 7

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-2">
      <div className="flex items-baseline justify-between mb-2">
        <div className="font-bold text-charcoal text-base">💧 Hydration</div>
        <div className="text-sm text-charcoal">
          <span className="font-bold">{waterOz}</span>
          <span className="text-gray-500"> / {target} oz</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-sage/10 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-terracotta transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => adjust(8)}
          className="tappable flex-1 bg-sage text-terracotta font-semibold py-2.5 rounded-md text-sm"
        >
          +8 oz
        </button>
        <button
          onClick={() => adjust(12)}
          className="tappable flex-1 bg-sage text-terracotta font-semibold py-2.5 rounded-md text-sm"
        >
          +12 oz
        </button>
        <button
          onClick={() => adjust(16)}
          className="tappable flex-1 bg-sage text-terracotta font-semibold py-2.5 rounded-md text-sm"
        >
          +16 oz
        </button>
        <button
          onClick={() => adjust(-8)}
          className="tappable bg-white border border-gray-300 text-gray-600 font-semibold py-2.5 px-3 rounded-md text-sm"
          aria-label="Subtract 8 ounces"
        >
          −8
        </button>
      </div>

      {isTravel && (
        <p className="mt-3 text-xs text-amber-700 italic">
          Travel day — sip slowly, target 40 oz
        </p>
      )}
      {isPeakDay && (
        <p className="mt-3 text-xs text-amber-700 italic">
          Peak week — stay strict on 1 gallon
        </p>
      )}
    </div>
  );
}
