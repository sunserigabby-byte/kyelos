"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import {
  getPRPWorkoutItems,
  getCompletedDayNums,
  getNextWorkoutDay,
  cellStateFor,
  type WorkoutItem,
  type WorkoutCellState,
} from "@/lib/workout-queue";

type Props = {
  /** Render only the next + a few upcoming as a compact preview. Used on Today. */
  preview?: boolean;
};

// Phase-wide workout queue. Workouts are listed in order; user can do them
// at their own pace and mark complete on the detail page. The first
// incomplete training day is highlighted as NEXT.
export default function WorkoutGrid({ preview = false }: Props) {
  const { person } = useProfile();
  const { activePhase } = usePhase();
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const items = useMemo(() => getPRPWorkoutItems(), []);
  const next = useMemo(() => getNextWorkoutDay(items, completed), [items, completed]);

  const load = useCallback(async () => {
    if (!activePhase) {
      setCompleted(new Set());
      setLoaded(true);
      return;
    }
    setCompleted(await getCompletedDayNums(person, activePhase.id));
    setLoaded(true);
  }, [person, activePhase?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!activePhase) return;
    const channel = supabase
      .channel(`workout_grid_${person}_${activePhase.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workout_sessions", filter: `phase_id=eq.${activePhase.id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [person, activePhase?.id, load]);

  if (!loaded) return null;

  const trainingItems = items.filter((i) => i.kind !== "rest");
  const doneCount = trainingItems.filter((i) => completed.has(i.dayNum)).length;
  const totalTraining = trainingItems.length;
  const pct = totalTraining > 0 ? Math.round((doneCount / totalTraining) * 100) : 0;

  if (preview) {
    return <PreviewGrid items={items} completed={completed} next={next} doneCount={doneCount} total={totalTraining} pct={pct} />;
  }

  return <FullGrid items={items} completed={completed} next={next} doneCount={doneCount} total={totalTraining} pct={pct} />;
}

// =============================================================
// Compact preview for Today — header stat + next 3 upcoming.
// =============================================================
function PreviewGrid({
  items,
  completed,
  next,
  doneCount,
  total,
  pct,
}: {
  items: WorkoutItem[];
  completed: Set<number>;
  next: number | null;
  doneCount: number;
  total: number;
  pct: number;
}) {
  // Show NEXT + 2 upcoming training items.
  const upcoming = items
    .filter((i) => i.kind === "training" && !completed.has(i.dayNum))
    .slice(0, 3);

  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between border-b-2 border-terracotta/60 pb-1 mb-3">
        <div className="text-charcoal font-bold text-sm uppercase tracking-wider">
          Workouts
        </div>
        <Link
          href="/fitness/workouts"
          className="text-[11px] text-charcoal/60 hover:text-charcoal"
        >
          Full schedule →
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-xs font-semibold text-charcoal">Phase progress</div>
          <div className="text-xs font-mono text-charcoal/70">
            {doneCount} / {total} · {pct}%
          </div>
        </div>
        <div className="h-1.5 bg-forest/10 rounded-full overflow-hidden">
          <div className="h-full bg-terracotta" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {upcoming.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
          🎉 All training workouts complete for this phase.
        </div>
      ) : (
        upcoming.map((item) => (
          <WorkoutRow
            key={item.dayNum}
            item={item}
            state={cellStateFor(item, completed, next)}
          />
        ))
      )}
    </div>
  );
}

function WorkoutRow({ item, state }: { item: WorkoutItem; state: WorkoutCellState }) {
  const isNext = state === "next";
  const borderClass = isNext
    ? "border-2 border-terracotta"
    : "border border-gray-200";
  const badge =
    state === "next" ? (
      <span className="bg-terracotta text-cream text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded">
        NEXT
      </span>
    ) : (
      <span className="bg-gray-100 text-gray-600 text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded">
        UPCOMING
      </span>
    );
  return (
    <Link
      href={`/fitness/workouts/${item.dayNum}`}
      className={`block bg-white ${borderClass} rounded-lg p-3 mb-2 hover:shadow-sm transition`}
    >
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div className="text-[10px] font-bold tracking-widest text-charcoal/60">
          DAY {item.dayNum} · W{item.weekNum}
        </div>
        {badge}
      </div>
      <div className="font-bold text-charcoal text-sm">{item.workoutName}</div>
      <div className="text-[11px] text-charcoal/60 italic">{item.focus}</div>
    </Link>
  );
}

// =============================================================
// Full grid for /fitness/workouts.
// =============================================================
function FullGrid({
  items,
  completed,
  next,
  doneCount,
  total,
  pct,
}: {
  items: WorkoutItem[];
  completed: Set<number>;
  next: number | null;
  doneCount: number;
  total: number;
  pct: number;
}) {
  const weeks = useMemo(() => {
    const map = new Map<number, WorkoutItem[]>();
    for (const item of items) {
      if (!map.has(item.weekNum)) map.set(item.weekNum, []);
      map.get(item.weekNum)!.push(item);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [items]);

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-xs font-bold tracking-widest text-charcoal/60 uppercase">Progress</div>
          <div className="text-sm font-mono font-bold text-charcoal">
            {doneCount} / {total} sessions · {pct}%
          </div>
        </div>
        <div className="h-2 bg-forest/10 rounded-full overflow-hidden">
          <div className="h-full bg-terracotta" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {weeks.map(([weekNum, weekItems]) => (
        <div key={weekNum} className="mb-4">
          <div className="text-xs font-bold tracking-widest text-charcoal/60 uppercase mb-2">
            Week {weekNum}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {weekItems.map((item) => (
              <Cell
                key={item.dayNum}
                item={item}
                state={cellStateFor(item, completed, next)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Cell({ item, state }: { item: WorkoutItem; state: WorkoutCellState }) {
  const styles: Record<WorkoutCellState, string> = {
    done: "bg-emerald-50 border-emerald-300 text-emerald-800",
    next: "bg-terracotta/10 border-2 border-terracotta text-charcoal",
    pending: "bg-white border-gray-200 text-charcoal",
    light: "bg-cream/40 border-gray-200 text-charcoal/80",
    rest: "bg-gray-100 border-gray-200 text-charcoal/40",
  };
  const label: Record<WorkoutCellState, string> = {
    done: "✓ DONE",
    next: "NEXT",
    pending: "PENDING",
    light: "LIGHT",
    rest: "REST",
  };

  // Rest cells aren't tappable.
  if (state === "rest") {
    return (
      <div className={`border rounded-lg p-2 ${styles[state]}`}>
        <div className="text-[10px] font-bold tracking-widest opacity-70">
          DAY {item.dayNum} · {label[state]}
        </div>
        <div className="text-xs font-semibold truncate">{item.workoutName}</div>
      </div>
    );
  }

  return (
    <Link
      href={`/fitness/workouts/${item.dayNum}`}
      className={`block border rounded-lg p-2 hover:shadow-sm transition ${styles[state]}`}
    >
      <div className="text-[10px] font-bold tracking-widest opacity-70">
        DAY {item.dayNum} · {label[state]}
      </div>
      <div className="text-xs font-semibold truncate">{item.workoutName}</div>
    </Link>
  );
}
