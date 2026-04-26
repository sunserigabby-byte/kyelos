"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Person } from "@/lib/plan-data";
import { maybeNudgePartner } from "@/lib/partner-nudges";

type Props = {
  person: Person;
  dayNum: number;
  itemKey: string;
  title: string;
  subtitle?: string;
  detail?: string;
};

export default function CheckItem({ person, dayNum, itemKey, title, subtitle, detail }: Props) {
  const [checked, setChecked] = useState(false);
  const [animating, setAnimating] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadState();

    // Live subscription: listen for changes to this specific item
    const channel = supabase
      .channel(`completion_${person}_${dayNum}_${itemKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "completions",
          filter: `person=eq.${person}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          const newRow = (payload.new as any) || (payload.old as any);
          if (
            newRow &&
            newRow.day_num === dayNum &&
            newRow.item_key === itemKey
          ) {
            const newVal = (payload.new as any)?.completed ?? false;
            setChecked(newVal);
          }
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person, dayNum, itemKey]);

  async function loadState() {
    const { data } = await supabase
      .from("completions")
      .select("completed")
      .eq("person", person)
      .eq("day_num", dayNum)
      .eq("item_key", itemKey)
      .maybeSingle();
    if (mountedRef.current) {
      setChecked(!!data?.completed);
    }
  }

  async function toggle() {
    const newVal = !checked;
    setChecked(newVal);

    // Haptic feedback on mobile
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
        completed: newVal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "person,day_num,item_key" }
    );

    if (newVal) {
      // Fire-and-forget partner nudge if applicable. Errors are swallowed
      // inside the helper (e.g., pre-migration table-missing).
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
