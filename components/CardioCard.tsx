"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";

type Props = { dayNum: number };

const OPTIONS = ["Cycling (light)", "Swimming", "Walking", "Skip today"];

export default function CardioCard({ dayNum }: Props) {
  const { person } = useProfile();
  const { activePhase } = usePhase();
  const phaseId = activePhase?.id;
  const [type, setType] = useState<string>("");
  const [duration, setDuration] = useState<string>("30");
  const [done, setDone] = useState(false);
  const [rowId, setRowId] = useState<string | null>(null);

  useEffect(() => {
    setType("");
    setDuration("30");
    setDone(false);
    setRowId(null);
    if (!phaseId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("cardio_logs")
        .select("*")
        .eq("person", person)
        .eq("phase_id", phaseId)
        .eq("day_num", dayNum)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled || !data) return;
      setType((data as any).cardio_type ?? "");
      setDuration(String((data as any).duration_minutes ?? 30));
      setDone(!!(data as any).completed);
      setRowId((data as any).id);
    })();
    return () => { cancelled = true; };
  }, [person, phaseId, dayNum]);

  async function save(patch: Partial<{ cardio_type: string; duration_minutes: number; completed: boolean }>) {
    if (!phaseId) return;
    const payload: any = {
      person,
      phase_id: phaseId,
      day_num: dayNum,
      cardio_type: patch.cardio_type ?? type,
      duration_minutes: patch.duration_minutes ?? (duration ? parseInt(duration, 10) : null),
      completed: patch.completed ?? done,
    };
    if (rowId) {
      await supabase.from("cardio_logs").update(payload).eq("id", rowId);
    } else {
      const { data } = await supabase.from("cardio_logs").insert(payload).select("id").maybeSingle();
      if (data) setRowId((data as any).id);
    }
  }

  const restingDays = dayNum <= 4;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <div className="font-bold text-charcoal text-sm mb-1">Daily Cardio</div>
      {restingDays ? (
        <p className="text-xs text-amber-700 italic mb-2">
          Optional — let knee settle first. Walk only if comfortable.
        </p>
      ) : (
        <p className="text-xs text-gray-500 mb-2">Pick a modality and duration.</p>
      )}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); save({ cardio_type: e.target.value }); }}
          className="bg-white border border-gray-300 rounded px-2 py-1.5 text-sm"
        >
          <option value="">Pick type…</option>
          {OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => save({ duration_minutes: duration ? parseInt(duration, 10) : 0 })}
            className="w-16 bg-white border border-gray-300 rounded px-2 py-1.5 text-sm text-right"
          />
          <span className="text-xs text-gray-500">min</span>
        </div>
      </div>
      <button
        onClick={() => {
          const nv = !done;
          setDone(nv);
          save({ completed: nv });
          if (nv && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
        }}
        className={`tappable w-full font-semibold py-2 rounded text-sm ${done ? "bg-cream border border-forest/30 text-charcoal line-through" : "bg-forest text-terracotta"}`}
      >
        {done ? "Cardio done ✓" : "Mark cardio done"}
      </button>
    </div>
  );
}
