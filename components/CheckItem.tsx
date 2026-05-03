"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Person } from "@/lib/plan-data";
import { maybeNudgePartner } from "@/lib/partner-nudges";
import { usePhase } from "@/components/PhaseContext";

type Props = {
  person: Person;
  dayNum: number;
  itemKey: string;
  title: string;
  subtitle?: string;
  detail?: string;
  /** Override the phase to write to. Defaults to active phase from context. */
  phaseId?: string;
  /** When true, taps are ignored (used for archived phase views). */
  readonly?: boolean;
};

export default function CheckItem({ person, dayNum, itemKey, title, subtitle, detail, phaseId, readonly }: Props) {
  const { activePhase } = usePhase();
  const effectivePhaseId = phaseId ?? activePhase?.id ?? null;

  const [checked, setChecked] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setChecked(false);
    if (!effectivePhaseId) return;

    let cancelled = false;

    async function loadState() {
      const { data } = await supabase
        .from("completions")
        .select("completed")
        .eq("person", person)
        .eq("day_num", dayNum)
        .eq("item_key", itemKey)
        .eq("phase_id", effectivePhaseId)
        .maybeSingle();
      if (cancelled) return;
      setChecked(!!data?.completed);
    }
    loadState();

    const channel = supabase
      .channel(`completion_${person}_${dayNum}_${itemKey}_${effectivePhaseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "completions",
          filter: `person=eq.${person}`,
        },
        (payload) => {
          if (cancelled) return;
          const newRow = (payload.new as any) || (payload.old as any);
          if (
            newRow &&
            newRow.day_num === dayNum &&
            newRow.item_key === itemKey &&
            newRow.phase_id === effectivePhaseId
          ) {
            const newVal = (payload.new as any)?.completed ?? false;
            setChecked(newVal);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [person, dayNum, itemKey, effectivePhaseId]);

  async function toggle() {
    if (readonly) return;
    if (!effectivePhaseId) return;

    const newVal = !checked;
    setChecked(newVal);

    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(newVal ? 10 : 5);
    }

    if (newVal) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 200);
    }

    await supabase.from("completions").upsert(
      {
        person,
        day_num: dayNum,
        item_key: itemKey,
        phase_id: effectivePhaseId,
        completed: newVal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "person,day_num,item_key,phase_id" }
    );

    if (newVal) {
      maybeNudgePartner(person, dayNum, itemKey);
    }
  }

  return (
    <div
      onClick={toggle}
      className={`tappable rounded-lg p-4 mb-2 border ${
        checked
          ? "bg-navy-light border-navy/30"
          : "bg-white border-gray-200 active:border-navy/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 w-6 h-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition ${
            checked ? "bg-navy border-navy" : "border-gray-300"
          } ${animating ? "check-pop" : ""}`}
        >
          {checked && (
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`font-semibold text-navy text-base ${
              checked ? "line-through opacity-60" : ""
            }`}
          >
            {title}
          </div>
          {subtitle && (
            <div
              className={`text-xs text-gray-500 ${
                checked ? "line-through opacity-60" : ""
              }`}
            >
              {subtitle}
            </div>
          )}
          {detail && (
            <div
              className={`text-sm text-gray-700 mt-1 ${
                checked ? "line-through opacity-60" : ""
              }`}
            >
              {detail}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
