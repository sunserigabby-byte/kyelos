"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import TodayBadge from "@/components/TodayBadge";
import WeightLogModal from "@/components/WeightLogModal";
import WorkoutGrid from "@/components/WorkoutGrid";
import { getCurrentPhaseDay, getTotalDays } from "@/lib/phases";
import {
  getVisibleGoals,
  getPhasesForGoal,
  overallProgress,
  activePhaseOf,
  CATEGORY_META,
  type Goal,
  type GoalPhase,
} from "@/lib/goals";
import { displayShort } from "@/lib/local-date";

type WeightPoint = { date: string; weight: number };
type Session = {
  id: string;
  workout_name: string;
  workout_date: string;
  day_num: number;
  completed: boolean | null;
};

type CoupleSession = Session & { person: "gabby" | "jon" };

export default function FitnessPage() {
  const { person, isCoupleMode } = useProfile();
  const { activePhase } = usePhase();
  const [weights, setWeights] = useState<WeightPoint[]>([]);
  const [weightsByPerson, setWeightsByPerson] = useState<{ gabby: WeightPoint[]; jon: WeightPoint[] }>({
    gabby: [],
    jon: [],
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coupleSessions, setCoupleSessions] = useState<CoupleSession[]>([]);
  const [fitnessGoals, setFitnessGoals] = useState<(Goal & { phases: GoalPhase[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightOpen, setWeightOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    if (isCoupleMode) {
      const [g, j, sessionRes, allGoals] = await Promise.all([
        supabase.from("daily_logs").select("date, weight").eq("person", "gabby").not("weight", "is", null).order("date", { ascending: false }).limit(30),
        supabase.from("daily_logs").select("date, weight").eq("person", "jon").not("weight", "is", null).order("date", { ascending: false }).limit(30),
        supabase.from("workout_sessions").select("id, workout_name, workout_date, day_num, completed, person").order("workout_date", { ascending: false }).limit(10),
        getVisibleGoals(person),
      ]);
      const toPoints = (rows: { date: string; weight: number }[] | null) =>
        (rows ?? [])
          .filter((w) => w.date && w.weight)
          .map((w) => ({ date: w.date, weight: Number(w.weight) }))
          .sort((a, b) => a.date.localeCompare(b.date));
      setWeightsByPerson({
        gabby: toPoints(g.data as { date: string; weight: number }[] | null),
        jon: toPoints(j.data as { date: string; weight: number }[] | null),
      });
      setCoupleSessions((sessionRes.data as CoupleSession[]) ?? []);
      const sharedFits = allGoals
        .filter((x) => x.owner === "shared" && x.category === "fitness");
      const withPhases = await Promise.all(
        sharedFits.map(async (gl) => ({ ...gl, phases: await getPhasesForGoal(gl.id) }))
      );
      setFitnessGoals(withPhases);
      setLoading(false);
      return;
    }

    const [weightRes, sessionRes, allGoals] = await Promise.all([
      supabase
        .from("daily_logs")
        .select("date, weight")
        .eq("person", person)
        .not("weight", "is", null)
        .order("date", { ascending: false })
        .limit(30),
      supabase
        .from("workout_sessions")
        .select("id, workout_name, workout_date, day_num, completed")
        .eq("person", person)
        .order("workout_date", { ascending: false })
        .limit(6),
      getVisibleGoals(person),
    ]);

    const wps = ((weightRes.data as { date: string; weight: number }[] | null) ?? [])
      .filter((w) => w.date && w.weight)
      .map((w) => ({ date: w.date, weight: Number(w.weight) }))
      .sort((a, b) => a.date.localeCompare(b.date));
    setWeights(wps);

    setSessions((sessionRes.data as Session[]) ?? []);

    const fits = allGoals.filter((g) => g.category === "fitness");
    const withPhases = await Promise.all(
      fits.map(async (g) => ({ ...g, phases: await getPhasesForGoal(g.id) }))
    );
    setFitnessGoals(withPhases);

    setLoading(false);
  }, [person, isCoupleMode]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`fitness_${person}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_sessions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_logs" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [person, load]);

  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>;

  return (
    <div>
      <TodayBadge
        startISO={activePhase?.start_date}
        context={activePhase ? "phase" : undefined}
      />
      <h1 className="text-2xl font-bold text-charcoal mb-1">
        {isCoupleMode ? "Fitness Together" : "Fitness"}
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        {isCoupleMode
          ? "Both of your plans, body progress, and recent training."
          : "Where you are in your plan, body progress, recent training."}
      </p>

      {!isCoupleMode && <PhaseHero />}

      {!isCoupleMode && (
        <div className="mb-2">
          <WorkoutGrid preview />
        </div>
      )}

      {isCoupleMode ? (
        <CoupleWeightSection
          weightsByPerson={weightsByPerson}
          onLog={() => setWeightOpen(true)}
        />
      ) : weights.length > 0 ? (
        <WeightTrendCard points={weights} onLog={() => setWeightOpen(true)} />
      ) : (
        <EmptyWeight onLog={() => setWeightOpen(true)} />
      )}

      {weightOpen && (
        <WeightLogModal
          onSaved={() => {
            setWeightOpen(false);
            load();
          }}
          onCancel={() => setWeightOpen(false)}
        />
      )}

      {isCoupleMode ? (
        <CoupleSessions sessions={coupleSessions} />
      ) : (
        <RecentSessions sessions={sessions} />
      )}

      {fitnessGoals.length > 0 && <FitnessGoalsSection goals={fitnessGoals} />}

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Link
          href="/fitness/vertical"
          className="tappable bg-white border border-forest/30 text-charcoal font-semibold py-2.5 px-3 rounded-md text-xs text-center"
        >
          🦘 Vertical Jump →
        </Link>
        <Link
          href="/fitness/strength"
          className="tappable bg-white border border-forest/30 text-charcoal font-semibold py-2.5 px-3 rounded-md text-xs text-center"
        >
          🏋️ Strength PRs →
        </Link>
        <Link
          href="/workout-history"
          className="tappable bg-white border border-forest/30 text-charcoal font-semibold py-2.5 px-3 rounded-md text-xs text-center"
        >
          Lift History →
        </Link>
        <Link
          href="/progress"
          className="tappable bg-white border border-forest/30 text-charcoal font-semibold py-2.5 px-3 rounded-md text-xs text-center"
        >
          Daily Trends →
        </Link>
        <Link
          href="/phases"
          className="tappable bg-white border border-forest/30 text-charcoal font-semibold py-2.5 px-3 rounded-md text-xs text-center"
        >
          Phase History →
        </Link>
        <Link
          href="/goals/new"
          className="tappable bg-white border border-forest/30 text-charcoal font-semibold py-2.5 px-3 rounded-md text-xs text-center"
        >
          + Fitness Goal
        </Link>
      </div>
    </div>
  );
}

function PhaseHero() {
  const { activePhase } = usePhase();
  if (!activePhase) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 text-center">
        <p className="text-sm text-charcoal/70">No active training phase.</p>
        <Link
          href="/phases"
          className="inline-block mt-2 text-xs text-terracotta font-semibold hover:underline"
        >
          View phase history →
        </Link>
      </div>
    );
  }
  const dayNum = getCurrentPhaseDay(activePhase);
  const total = getTotalDays(activePhase);
  const pct = Math.round((dayNum / total) * 100);

  return (
    <div className="rounded-xl p-5 mb-4 text-cream bg-gradient-to-br from-forest to-forest-dark shadow-md">
      <div className="text-[10px] tracking-widest font-bold text-cream/70 mb-1">CURRENT PHASE</div>
      <div className="text-xl font-bold mb-1">{activePhase.name}</div>
      {activePhase.focus_label && (
        <div className="text-sm text-cream/80 italic mb-2">{activePhase.focus_label}</div>
      )}
      <div className="text-sm text-cream/90 mb-2">
        <span className="font-bold">Day {dayNum}</span> of {total}{" "}
        <span className="text-cream/60">· {pct}%</span>
      </div>
      <div className="h-2 bg-cream/20 rounded-full overflow-hidden">
        <div className="h-full bg-terracotta" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function WeightTrendCard({ points, onLog }: { points: WeightPoint[]; onLog: () => void }) {
  const min = Math.min(...points.map((p) => p.weight));
  const max = Math.max(...points.map((p) => p.weight));
  const range = Math.max(1, max - min);

  const first = points[0];
  const last = points[points.length - 1];
  const delta = last.weight - first.weight;
  const trendLabel =
    Math.abs(delta) < 0.1
      ? "flat"
      : delta < 0
      ? `↓ ${Math.abs(delta).toFixed(1)} lb`
      : `↑ ${delta.toFixed(1)} lb`;
  const trendColor = delta < 0 ? "text-emerald-700" : delta > 0 ? "text-amber-700" : "text-charcoal/70";

  const w = 320;
  const h = 100;
  const pad = { l: 30, r: 8, t: 12, b: 18 };

  const firstMs = Date.parse(first.date + "T00:00:00");
  const lastMs = Date.parse(last.date + "T00:00:00");
  const span = Math.max(1, lastMs - firstMs);

  const x = (iso: string) =>
    pad.l + ((Date.parse(iso + "T00:00:00") - firstMs) / span) * (w - pad.l - pad.r);
  const y = (v: number) =>
    pad.t + (1 - (v - min) / range) * (h - pad.t - pad.b);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.date).toFixed(1)} ${y(p.weight).toFixed(1)}`)
    .join(" ");

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
      <div className="flex items-baseline justify-between mb-2 gap-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-charcoal">Weight Trend</div>
          <div className="text-[11px] text-charcoal/60 truncate">
            {points.length} logs · {displayShort(first.date)} – {displayShort(last.date)}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-base font-mono font-bold text-charcoal">{last.weight.toFixed(1)} lb</div>
          <div className={`text-[11px] font-semibold ${trendColor}`}>{trendLabel}</div>
        </div>
        <button
          onClick={onLog}
          className="tappable bg-forest text-terracotta font-semibold py-1.5 px-2.5 rounded-md text-[11px] flex-shrink-0"
        >
          + Log
        </button>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" aria-label="Weight trend chart">
        <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#e5e7eb" />
        <path d={linePath} fill="none" stroke="#C7785A" strokeWidth="2" />
        {points.map((p) => (
          <circle key={p.date} cx={x(p.date)} cy={y(p.weight)} r="2" fill="#C7785A" />
        ))}
        <text x="4" y={pad.t + 4} fontSize="9" fill="#6b7280">
          {max.toFixed(0)}
        </text>
        <text x="4" y={h - pad.b + 1} fontSize="9" fill="#6b7280">
          {min.toFixed(0)}
        </text>
      </svg>
    </div>
  );
}

function RecentSessions({ sessions }: { sessions: Session[] }) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between border-b-2 border-terracotta/60 pb-1 mb-3">
        <div className="text-charcoal font-bold text-sm uppercase tracking-wider">Recent Workouts</div>
        <Link href="/workout-history" className="text-[11px] text-charcoal/60 hover:text-charcoal">
          All sessions →
        </Link>
      </div>
      {sessions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-xs text-charcoal/60 italic">
          No workouts logged yet.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {sessions.map((s) => (
            <div key={s.id} className="p-3 flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-bold text-charcoal truncate">{s.workout_name}</div>
                <div className="text-[11px] text-charcoal/60">
                  {displayShort(s.workout_date)} · Day {s.day_num}
                </div>
              </div>
              {s.completed && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  ✓ DONE
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FitnessGoalsSection({ goals }: { goals: (Goal & { phases: GoalPhase[] })[] }) {
  return (
    <div className="mb-4">
      <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3">
        Fitness Goals
      </div>
      {goals.map((g) => {
        const meta = CATEGORY_META[g.category];
        const pct = Math.round(overallProgress(g.phases) * 100);
        const active = activePhaseOf(g.phases);
        return (
          <Link
            key={g.id}
            href={`/goals/${g.id}`}
            className={`block bg-white border border-gray-200 border-l-4 ${meta.accentClass} rounded-lg p-3 mb-2 hover:shadow-sm transition`}
          >
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <div className="font-bold text-charcoal text-sm truncate">
                {meta.icon} {g.title}
              </div>
              <div className="text-xs font-bold text-charcoal">{pct}%</div>
            </div>
            <div className="h-1.5 bg-forest/10 rounded-full overflow-hidden">
              <div className="h-full bg-terracotta" style={{ width: `${pct}%` }} />
            </div>
            {active && (
              <div className="text-[11px] text-charcoal/60 mt-1 truncate">
                Phase {active.phase_number}: {active.title}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function CoupleWeightSection({
  weightsByPerson,
  onLog,
}: {
  weightsByPerson: { gabby: WeightPoint[]; jon: WeightPoint[] };
  onLog: () => void;
}) {
  const { gabby, jon } = weightsByPerson;
  const empty = gabby.length === 0 && jon.length === 0;
  if (empty) {
    return <EmptyWeight onLog={onLog} />;
  }
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between border-b-2 border-terracotta/60 pb-1 mb-3">
        <div className="text-charcoal font-bold text-sm uppercase tracking-wider">
          Weight Trends
        </div>
        <button
          onClick={onLog}
          className="tappable bg-forest text-terracotta font-semibold py-1.5 px-2.5 rounded-md text-[11px]"
        >
          + Log
        </button>
      </div>
      <CoupleWeightRow label="Gabby" accent="border-l-terracotta" points={gabby} />
      <CoupleWeightRow label="Jon" accent="border-l-forest" points={jon} />
    </div>
  );
}

function CoupleWeightRow({
  label,
  accent,
  points,
}: {
  label: string;
  accent: string;
  points: WeightPoint[];
}) {
  if (points.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 border-l-4 ${accent} rounded-lg p-3 mb-3 text-xs text-charcoal/60 italic`}>
        {label}: no weight logs yet.
      </div>
    );
  }
  const last = points[points.length - 1];
  const first = points[0];
  const delta = last.weight - first.weight;
  const trendLabel =
    Math.abs(delta) < 0.1
      ? "flat"
      : delta < 0
      ? `↓ ${Math.abs(delta).toFixed(1)} lb`
      : `↑ ${delta.toFixed(1)} lb`;
  const trendColor = delta < 0 ? "text-emerald-700" : delta > 0 ? "text-amber-700" : "text-charcoal/70";

  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${accent} rounded-lg p-3 mb-3`}>
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-sm font-bold text-charcoal">{label}</div>
        <div className="text-right">
          <div className="text-base font-mono font-bold text-charcoal">{last.weight.toFixed(1)} lb</div>
          <div className={`text-[11px] font-semibold ${trendColor}`}>
            {trendLabel} · {points.length} logs
          </div>
        </div>
      </div>
    </div>
  );
}

function CoupleSessions({ sessions }: { sessions: CoupleSession[] }) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between border-b-2 border-terracotta/60 pb-1 mb-3">
        <div className="text-charcoal font-bold text-sm uppercase tracking-wider">
          Recent Workouts
        </div>
        <Link href="/workout-history" className="text-[11px] text-charcoal/60 hover:text-charcoal">
          All sessions →
        </Link>
      </div>
      {sessions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-xs text-charcoal/60 italic">
          No workouts logged yet.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {sessions.map((s) => {
            const isGabby = s.person === "gabby";
            const pill = isGabby
              ? "bg-terracotta/15 text-terracotta border-terracotta/20"
              : "bg-forest/15 text-forest border-forest/30";
            return (
              <div key={s.id} className="p-3 flex items-baseline gap-3">
                <span
                  className={`text-[10px] font-bold tracking-wider uppercase border rounded px-1.5 py-0.5 flex-shrink-0 ${pill}`}
                >
                  {isGabby ? "Gabby" : "Jon"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-charcoal truncate">{s.workout_name}</div>
                  <div className="text-[11px] text-charcoal/60">
                    {displayShort(s.workout_date)} · Day {s.day_num}
                  </div>
                </div>
                {s.completed && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex-shrink-0">
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyWeight({ onLog }: { onLog: () => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 text-center">
      <div className="text-3xl mb-1">⚖️</div>
      <div className="text-sm font-bold text-charcoal mb-0.5">No weight logs yet</div>
      <p className="text-xs text-charcoal/60 mb-3">
        Log a weight to start the trend chart. Anytime works — morning weigh-in or whenever.
      </p>
      <button
        onClick={onLog}
        className="tappable bg-forest text-terracotta font-semibold py-2 px-4 rounded-md text-sm"
      >
        + Log weight
      </button>
    </div>
  );
}
