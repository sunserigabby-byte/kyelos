"use client";

import { useEffect, useMemo, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import { supabase } from "@/lib/supabase";
import { getCurrentPhaseDay } from "@/lib/phases";
import {
  getVacationPlan,
  getVacationTargets,
  type VacationDay,
} from "@/lib/vacation-plan";
import CheckItem from "@/components/CheckItem";
import DaySelector from "@/components/DaySelector";

type DailyLog = {
  protein_g: number | null;
  water_oz: number | null;
  steps: number | null;
  diet_sodas: number | null;
  recovery_mode: boolean | null;
  dandelion_count: number | null;
};

const EMPTY_LOG: DailyLog = {
  protein_g: 0,
  water_oz: 0,
  steps: 0,
  diet_sodas: 0,
  recovery_mode: false,
  dandelion_count: 0,
};

function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export default function VacationToday() {
  const { person } = useProfile();
  const { activePhase } = usePhase();
  const plan = getVacationPlan(person);

  const todayDay = activePhase ? getCurrentPhaseDay(activePhase, new Date()) : 1;
  const [selectedDay, setSelectedDay] = useState(todayDay);

  // When phase or person changes, jump back to today's day so we don't strand
  // the user on a day from a different scope.
  useEffect(() => {
    setSelectedDay(todayDay);
  }, [todayDay, activePhase?.id, person]);

  if (!activePhase) return null;
  const day = plan[selectedDay - 1] ?? plan[0];
  const dayNum = day.day;

  return (
    <div>
      <DaySelector
        currentDay={todayDay}
        selectedDay={selectedDay}
        onSelect={setSelectedDay}
        totalDays={plan.length}
      />

      {/* Inner content remounts cleanly on day or phase change so the various
          cards never flash a previous day's values. */}
      <div key={`${person}-${activePhase.id}-${dayNum}`}>
      <VibeBanner day={day} dayNum={dayNum} totalDays={plan.length} />

      <DailyLogShell person={person} dayNum={dayNum} isoDate={day.isoDate}>
        {(log, update) => (
          <>
            {log.recovery_mode && (
              <div className="bg-gold-light border border-gold/60 rounded-md px-3 py-2 mb-3 text-sm text-navy">
                🚰 Recovery Mode — extra water + dandelion today
              </div>
            )}

            <DailyTargetsCard person={person} log={log} update={update} />

            <BeachWorkoutCard day={day} dayNum={dayNum} />

            <SmartMealsCard day={day} dayNum={dayNum} />

            <SupplementsCard
              dayNum={dayNum}
              dandelionCount={log.dandelion_count ?? 0}
              recoveryMode={!!log.recovery_mode}
              onDandelion={(n) => update({ dandelion_count: Math.max(0, n) })}
            />

            <DietSodaCard
              count={log.diet_sodas ?? 0}
              onChange={(n) => update({ diet_sodas: Math.max(0, n) })}
            />

            <RecoveryToggleCard
              on={!!log.recovery_mode}
              onToggle={() => update({ recovery_mode: !log.recovery_mode })}
            />
          </>
        )}
      </DailyLogShell>
      </div>
    </div>
  );
}

// ============================================
// Shell that loads/subscribes to daily_logs and provides update()
// ============================================

function DailyLogShell({
  person,
  dayNum,
  isoDate,
  children,
}: {
  person: "gabby" | "jon";
  dayNum: number;
  isoDate: string;
  children: (
    log: DailyLog,
    update: (patch: Partial<DailyLog>) => Promise<void>
  ) => React.ReactNode;
}) {
  const { activePhase } = usePhase();
  const phaseId = activePhase?.id;
  const [log, setLog] = useState<DailyLog>(EMPTY_LOG);

  useEffect(() => {
    setLog(EMPTY_LOG);
    if (!phaseId) return;
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("daily_logs")
        .select("protein_g, water_oz, steps, diet_sodas, recovery_mode, dandelion_count")
        .eq("person", person)
        .eq("day_num", dayNum)
        .eq("phase_id", phaseId)
        .maybeSingle();
      if (cancelled) return;
      if (data) setLog(data as DailyLog);
    }
    load();

    const channel = supabase
      .channel(`vac_log_${person}_${dayNum}_${phaseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_logs",
          filter: `person=eq.${person}`,
        },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as any;
          if (row && row.day_num === dayNum && row.phase_id === phaseId) {
            setLog({
              protein_g: row.protein_g ?? 0,
              water_oz: row.water_oz ?? 0,
              steps: row.steps ?? 0,
              diet_sodas: row.diet_sodas ?? 0,
              recovery_mode: !!row.recovery_mode,
              dandelion_count: row.dandelion_count ?? 0,
            });
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [person, dayNum, phaseId]);

  async function update(patch: Partial<DailyLog>) {
    if (!phaseId) return;
    const next = { ...log, ...patch };
    setLog(next);
    await supabase.from("daily_logs").upsert(
      {
        person,
        day_num: dayNum,
        phase_id: phaseId,
        date: isoDate,
        protein_g: next.protein_g ?? 0,
        water_oz: next.water_oz ?? 0,
        steps: next.steps ?? 0,
        diet_sodas: next.diet_sodas ?? 0,
        recovery_mode: next.recovery_mode ?? false,
        dandelion_count: next.dandelion_count ?? 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "person,day_num,phase_id" }
    );
  }

  return <>{children(log, update)}</>;
}

// ============================================
// Vibe banner
// ============================================

function VibeBanner({
  day,
  dayNum,
  totalDays,
}: {
  day: VacationDay;
  dayNum: number;
  totalDays: number;
}) {
  return (
    <div className="bg-navy text-white rounded-lg p-5 mb-4 border-t-4 border-b-4 border-gold">
      <div className="text-gold text-xs font-bold tracking-widest mb-1">
        🌴 PR DAY {dayNum} OF {totalDays}
      </div>
      <div className="text-2xl font-bold mb-1">{day.vibe}</div>
      <div className="text-white/70 text-sm">{day.date}</div>
    </div>
  );
}

// ============================================
// Daily targets card (protein, water, steps)
// ============================================

function DailyTargetsCard({
  person,
  log,
  update,
}: {
  person: "gabby" | "jon";
  log: DailyLog;
  update: (patch: Partial<DailyLog>) => Promise<void>;
}) {
  const targets = useMemo(
    () => getVacationTargets(person, !!log.recovery_mode),
    [person, log.recovery_mode]
  );
  const [proteinModalOpen, setProteinModalOpen] = useState(false);
  const [stepsInput, setStepsInput] = useState<string>("");

  const protein = log.protein_g ?? 0;
  const water = log.water_oz ?? 0;
  const steps = log.steps ?? 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="text-navy font-bold text-sm mb-3">Today's Targets</div>

      {/* Protein */}
      <TargetRow
        label="🥩 Protein"
        current={protein}
        target={targets.proteinG}
        unit="g"
      >
        <button
          onClick={() => setProteinModalOpen(true)}
          className="tappable bg-navy text-gold font-semibold py-1.5 px-3 rounded-md text-xs"
        >
          + Add
        </button>
      </TargetRow>

      {/* Water */}
      <TargetRow
        label="💧 Water"
        current={water}
        target={targets.waterOz}
        unit="oz"
      >
        <div className="flex gap-1">
          {[8, 12, 16].map((d) => (
            <button
              key={d}
              onClick={() => {
                vibrate(8);
                update({ water_oz: water + d });
              }}
              className="tappable bg-navy text-gold font-semibold py-1.5 px-2 rounded-md text-xs"
            >
              +{d}
            </button>
          ))}
          <button
            onClick={() => {
              vibrate(5);
              update({ water_oz: Math.max(0, water - 8) });
            }}
            className="tappable bg-white border border-gray-300 text-gray-600 font-semibold py-1.5 px-2 rounded-md text-xs"
          >
            −8
          </button>
        </div>
      </TargetRow>

      {/* Steps */}
      <TargetRow
        label="👟 Steps"
        current={steps}
        target={targets.steps}
        unit=""
        formatVal={(n) => n.toLocaleString()}
      >
        <div className="flex gap-1 items-center">
          <input
            type="text"
            inputMode="numeric"
            value={stepsInput}
            onChange={(e) => setStepsInput(e.target.value.replace(/[^\d]/g, ""))}
            placeholder={String(steps || 0)}
            className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm text-right focus:border-navy focus:outline-none"
          />
          <button
            onClick={() => {
              const n = parseInt(stepsInput, 10);
              if (Number.isFinite(n)) {
                vibrate(8);
                update({ steps: n });
                setStepsInput("");
              }
            }}
            className="tappable bg-navy text-gold font-semibold py-1.5 px-2 rounded-md text-xs"
          >
            Set
          </button>
        </div>
      </TargetRow>

      {proteinModalOpen && (
        <ProteinQuickAdd
          current={protein}
          onAdd={(n) => {
            vibrate(8);
            update({ protein_g: protein + n });
            setProteinModalOpen(false);
          }}
          onClose={() => setProteinModalOpen(false)}
        />
      )}
    </div>
  );
}

function TargetRow({
  label,
  current,
  target,
  unit,
  formatVal,
  children,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  formatVal?: (n: number) => string;
  children: React.ReactNode;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  const fmt = formatVal ?? ((n: number) => String(n));
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-sm font-semibold text-navy">{label}</div>
        <div className="text-xs text-navy">
          <span className="font-bold">{fmt(current)}</span>
          <span className="text-gray-500"> / {fmt(target)}{unit}</span>
        </div>
      </div>
      <div className="h-2 bg-navy/10 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gold transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-end">{children}</div>
    </div>
  );
}

function ProteinQuickAdd({
  current,
  onAdd,
  onClose,
}: {
  current: number;
  onAdd: (n: number) => void;
  onClose: () => void;
}) {
  const [custom, setCustom] = useState("");
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-2xl p-5 fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-bold text-navy text-lg mb-1">Add Protein</div>
        <div className="text-sm text-gray-500 mb-4">
          Currently at <span className="font-semibold text-navy">{current}g</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[15, 25, 40].map((g) => (
            <button
              key={g}
              onClick={() => onAdd(g)}
              className="tappable bg-navy text-gold font-semibold py-3 rounded-md text-sm"
            >
              + {g}g
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            inputMode="numeric"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Custom grams"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-base focus:border-navy focus:outline-none"
          />
          <button
            onClick={() => {
              const n = parseInt(custom, 10);
              if (Number.isFinite(n) && n > 0) onAdd(n);
            }}
            className="tappable bg-navy text-gold font-semibold py-2 px-4 rounded-md text-sm"
          >
            Add
          </button>
        </div>
        <button
          onClick={onClose}
          className="tappable w-full text-gray-500 text-sm py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ============================================
// Beach workout card
// ============================================

function BeachWorkoutCard({ day, dayNum }: { day: VacationDay; dayNum: number }) {
  const [expanded, setExpanded] = useState(false);
  const { person } = useProfile();
  const [restDay, setRestDay] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="flex items-baseline justify-between mb-1">
        <div className="font-bold text-navy text-base">{day.beachWorkout.title}</div>
        <div className="text-xs text-gray-500">{day.beachWorkout.duration}</div>
      </div>

      {!restDay && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="tappable text-xs font-semibold text-navy underline-offset-2 hover:underline mb-2"
          >
            {expanded ? "Hide workout ↑" : "Show workout ↓"}
          </button>

          {expanded && (
            <div className="bg-navy-light/40 rounded-md p-3 mb-3">
              <p className="text-xs text-gray-700 mb-2 italic">
                {day.beachWorkout.intro}
              </p>
              <ul className="text-sm text-gray-700 space-y-1 pl-4">
                {day.beachWorkout.exercises.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <CheckItem
                person={person}
                dayNum={dayNum}
                itemKey="vac_workout_done"
                title="✓ Done"
              />
            </div>
            <button
              onClick={() => setRestDay(true)}
              className="tappable bg-gold-light border border-gold/60 text-navy font-semibold rounded-lg px-3 py-3 text-sm"
            >
              🌊 Rest Day
            </button>
          </div>
        </>
      )}

      {restDay && (
        <div>
          <p className="text-sm text-navy/80 italic mb-2">
            Active recovery today — {day.beachWorkout.restDayMessage}
          </p>
          <CheckItem
            person={person}
            dayNum={dayNum}
            itemKey="vac_workout_rest_day"
            title="Rest day complete"
          />
          <button
            onClick={() => setRestDay(false)}
            className="tappable text-xs text-navy/60 underline-offset-2 hover:underline mt-1"
          >
            Switch back to workout
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Smart meals card
// ============================================

function SmartMealsCard({ day, dayNum }: { day: VacationDay; dayNum: number }) {
  const { person } = useProfile();
  const meals = [
    { key: "vac_meal_breakfast", label: "Breakfast", suggestion: day.suggestions.breakfast },
    { key: "vac_meal_lunch", label: "Lunch", suggestion: day.suggestions.lunch },
    {
      key: "vac_meal_dinner",
      label: "Dinner",
      suggestion: "Eat what you want — protein focus = bonus",
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="text-navy font-bold text-sm mb-2">Smart Meals</div>
      {meals.map((m) => (
        <CheckItem
          key={m.key}
          person={person}
          dayNum={dayNum}
          itemKey={m.key}
          title={m.label}
          detail={m.suggestion}
        />
      ))}
    </div>
  );
}

// ============================================
// Supplements card with dandelion counter
// ============================================

function SupplementsCard({
  dayNum,
  dandelionCount,
  recoveryMode,
  onDandelion,
}: {
  dayNum: number;
  dandelionCount: number;
  recoveryMode: boolean;
  onDandelion: (n: number) => void;
}) {
  const { person } = useProfile();
  const dandelionGoal = recoveryMode ? 2 : 1;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="text-navy font-bold text-sm mb-2">Supplements</div>
      <CheckItem
        person={person}
        dayNum={dayNum}
        itemKey="vac_supp_creatine"
        title="Creatine 5g"
      />
      <CheckItem
        person={person}
        dayNum={dayNum}
        itemKey="vac_supp_mag"
        title="Magnesium PM"
      />

      {/* Dandelion counter */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2 flex items-center justify-between">
        <div>
          <div className="font-semibold text-navy text-sm">🍵 Dandelion tea</div>
          <div className="text-xs text-gray-500">
            {dandelionCount} of {dandelionGoal}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => {
              vibrate(5);
              onDandelion(dandelionCount - 1);
            }}
            className="tappable bg-white border border-gray-300 text-gray-600 w-8 h-8 rounded-md font-bold"
            aria-label="One less dandelion tea"
          >
            −
          </button>
          <span className="font-bold text-navy w-6 text-center">{dandelionCount}</span>
          <button
            onClick={() => {
              vibrate(8);
              onDandelion(dandelionCount + 1);
            }}
            className="tappable bg-navy text-gold w-8 h-8 rounded-md font-bold"
            aria-label="One more dandelion tea"
          >
            +
          </button>
        </div>
      </div>

      <CheckItem
        person={person}
        dayNum={dayNum}
        itemKey="vac_supp_whey"
        title="Whey shake (optional)"
      />
    </div>
  );
}

// ============================================
// Diet soda counter
// ============================================

function DietSodaCard({
  count,
  onChange,
}: {
  count: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between">
        <div className="text-navy font-semibold text-sm">Diet sodas today</div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => {
              vibrate(5);
              onChange(count - 1);
            }}
            className="tappable bg-white border border-gray-300 text-gray-600 w-8 h-8 rounded-md font-bold"
            aria-label="One less diet soda"
          >
            −
          </button>
          <span className="font-bold text-navy w-6 text-center">{count}</span>
          <button
            onClick={() => {
              vibrate(8);
              onChange(count + 1);
            }}
            className="tappable bg-navy text-gold w-8 h-8 rounded-md font-bold"
            aria-label="One more diet soda"
          >
            +
          </button>
        </div>
      </div>
      {count >= 3 && (
        <div className="bg-gold-light/60 border border-gold/40 rounded-md px-3 py-2 mt-3 text-xs text-navy">
          Heads up — artificial sweeteners can cause bloat. Consider swapping for sparkling water.
        </div>
      )}
    </div>
  );
}

// ============================================
// Recovery mode toggle
// ============================================

function RecoveryToggleCard({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={() => {
        vibrate(8);
        onToggle();
      }}
      className="tappable w-full bg-white border border-gray-200 rounded-lg p-4 mb-3 flex items-center justify-between text-left"
    >
      <div className="min-w-0 pr-3">
        <div className="font-semibold text-navy text-sm">Had a heavy night?</div>
        <div className="text-xs text-gray-500">
          Tap on to bump water + dandelion targets and add a banner reminder.
        </div>
      </div>
      <div
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          on ? "bg-navy" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </div>
    </button>
  );
}
