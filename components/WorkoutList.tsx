"use client";

import type { Exercise } from "@/lib/training-types";
import WorkoutTracker from "@/components/WorkoutTracker";

type Props = {
  exercises: Exercise[];
  sessionId: string | null;
  dayNum: number;
};

/**
 * Renders a list of exercises with consecutive same-`supersetGroup` items
 * wrapped together in a bordered "Superset X" container. Items without a
 * supersetGroup render as solo WorkoutTracker cards (current behavior).
 */
export default function WorkoutList({ exercises, sessionId, dayNum }: Props) {
  const groups: { groupKey: string | null; exercises: Exercise[] }[] = [];
  let current: { groupKey: string; exercises: Exercise[] } | null = null;

  for (const ex of exercises) {
    if (ex.supersetGroup) {
      if (current && current.groupKey === ex.supersetGroup) {
        current.exercises.push(ex);
      } else {
        current = { groupKey: ex.supersetGroup, exercises: [ex] };
        groups.push(current);
      }
    } else {
      groups.push({ groupKey: null, exercises: [ex] });
      current = null;
    }
  }

  return (
    <>
      {groups.map((g, i) =>
        g.groupKey ? (
          <SupersetCard
            key={`ss-${g.groupKey}-${i}`}
            groupKey={g.groupKey}
            exercises={g.exercises}
            sessionId={sessionId}
            dayNum={dayNum}
          />
        ) : (
          <WorkoutTracker
            key={g.exercises[0].name}
            exercise={g.exercises[0]}
            sessionId={sessionId}
            dayNum={dayNum}
          />
        )
      )}
    </>
  );
}

function SupersetCard({
  groupKey,
  exercises,
  sessionId,
  dayNum,
}: {
  groupKey: string;
  exercises: Exercise[];
  sessionId: string | null;
  dayNum: number;
}) {
  const first = exercises[0];
  // Round count = number of sets in the longest exercise of the group
  const rounds = exercises.reduce((max, ex) => Math.max(max, ex.sets.length), 0);
  const restBetween = first.restBetweenExercises;
  const restRounds = first.restBetweenRounds;

  return (
    <div className="border-2 border-terracotta rounded-lg p-2 mb-3 bg-cream-light">
      <div className="px-2 pt-1 pb-2 mb-1 border-b border-terracotta/30">
        <div className="text-[10px] font-bold tracking-widest text-terracotta">
          SUPERSET {groupKey} · ALTERNATE · {rounds} ROUND{rounds === 1 ? "" : "S"}
        </div>
        <div className="text-[11px] text-charcoal/70 italic mt-0.5">
          Do Set 1 of each in order, then rest{" "}
          {restRounds ? `${restRounds}s` : "as needed"} and start Round 2.
          {restBetween
            ? ` (${restBetween}s rest between alternating exercises if you need it.)`
            : ""}
        </div>
      </div>
      <div className="space-y-1">
        {exercises.map((ex) => (
          <WorkoutTracker key={ex.name} exercise={ex} sessionId={sessionId} dayNum={dayNum} />
        ))}
      </div>
    </div>
  );
}
