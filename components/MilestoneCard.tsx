"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import {
  getTodayAndUpcoming,
  markTestCompleted,
  type ScheduledTest,
} from "@/lib/scheduled-tests";
import { todayLocalISO, displayShort } from "@/lib/local-date";

const TYPE_ICON: Record<string, string> = {
  body_comp: "⚖️",
  vertical: "🦘",
  cmj: "⚡",
  strength_pr: "🏋️",
  photo: "📸",
};

// Surfaces scheduled_tests due today or in the next ~3 days.
// Tap "Mark done" to flip completed=true.
export default function MilestoneCard() {
  const { person } = useProfile();
  const [tests, setTests] = useState<ScheduledTest[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const all = await getTodayAndUpcoming(person, 3);
    setTests(all.filter((t) => !t.completed));
    setLoaded(true);
  }, [person]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`milestones_${person}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "scheduled_tests" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [person, load]);

  if (!loaded || tests.length === 0) return null;
  const today = todayLocalISO();

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-3 mb-3">
      <div className="text-amber-800 text-[10px] font-bold tracking-widest mb-2">
        📅 SCHEDULED TESTS
      </div>
      {tests.map((t) => {
        const due = t.scheduled_date === today;
        return (
          <div key={t.id} className="mb-2 last:mb-0">
            <div className="flex items-start gap-2">
              <div className="text-base flex-shrink-0">{TYPE_ICON[t.test_type] ?? "📋"}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-charcoal">{t.test_label}</div>
                <div className="text-[11px] text-charcoal/60">
                  {due ? "Today" : displayShort(t.scheduled_date)}
                  {t.target_value ? ` · ${t.target_value}` : ""}
                </div>
              </div>
              <button
                onClick={() => markTestCompleted(t.id, true)}
                className="tappable bg-amber-600 text-white text-[11px] font-semibold py-1 px-2.5 rounded flex-shrink-0"
              >
                Mark done
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
