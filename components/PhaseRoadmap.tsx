"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import {
  PHASE_ORDER,
  phases,
  getActiveTrainingPhase,
  dayNInPhase,
  totalDaysInPhase,
  type TrainingPhase,
  type PhaseCode,
} from "@/lib/training-plan";
import {
  getTestsForPhase,
  getMilestonesForPhase,
  markTestCompleted,
  type ScheduledTest,
  type PhaseMilestone,
} from "@/lib/scheduled-tests";
import { todayLocalISO, displayShort } from "@/lib/local-date";

const FOCUS_TINT: Record<string, string> = {
  Rebuild: "border-l-amber-500",
  Build: "border-l-emerald-500",
  Strength: "border-l-blue-500",
  Power: "border-l-purple-500",
  Hold: "border-l-cyan-500",
  Cut: "border-l-rose-500",
};

export default function PhaseRoadmap() {
  const iso = todayLocalISO();
  const activePhase = getActiveTrainingPhase(iso);

  return (
    <div>
      {/* Timeline strip */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
        <div className="text-xs font-bold tracking-widest text-charcoal/60 uppercase mb-2">
          Roadmap · Jun 9 → Dec 13, 2026
        </div>
        <div className="flex h-3 rounded-full overflow-hidden">
          {PHASE_ORDER.map((code) => {
            const p = phases[code];
            const days = totalDaysInPhase(p);
            const isActive = code === activePhase.code;
            return (
              <div
                key={code}
                style={{ flex: days }}
                className={`${tintFor(p.focusLabel)} ${
                  isActive ? "ring-2 ring-terracotta ring-inset" : ""
                } first:rounded-l-full last:rounded-r-full`}
                title={p.name}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-charcoal/60">
          {PHASE_ORDER.map((code) => (
            <span key={code} className="font-bold">
              {phases[code].focusLabel.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {PHASE_ORDER.map((code) => (
        <PhaseCard key={code} phase={phases[code]} isActive={code === activePhase.code} />
      ))}
    </div>
  );
}

function tintFor(focus: string): string {
  switch (focus) {
    case "Rebuild": return "bg-amber-400";
    case "Build": return "bg-emerald-400";
    case "Strength": return "bg-blue-400";
    case "Power": return "bg-purple-400";
    case "Hold": return "bg-cyan-400";
    case "Cut": return "bg-rose-400";
    default: return "bg-gray-300";
  }
}

function PhaseCard({ phase, isActive }: { phase: TrainingPhase; isActive: boolean }) {
  const { person } = useProfile();
  const [open, setOpen] = useState(isActive);
  const [tests, setTests] = useState<ScheduledTest[]>([]);
  const [milestones, setMilestones] = useState<PhaseMilestone[]>([]);
  const accent = FOCUS_TINT[phase.focusLabel] ?? "border-l-forest";

  const load = useCallback(async () => {
    if (!open) return;
    const [t, m] = await Promise.all([
      getTestsForPhase(person, phase.code),
      getMilestonesForPhase(phase.code),
    ]);
    setTests(t);
    setMilestones(m);
  }, [open, person, phase.code]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const channel = supabase
      .channel(`phase_roadmap_${phase.code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "scheduled_tests" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, phase.code, load]);

  const iso = todayLocalISO();
  const dayN = isActive ? dayNInPhase(phase, iso) : null;
  const total = totalDaysInPhase(phase);

  return (
    <div
      className={`bg-white border border-gray-200 border-l-4 ${accent} rounded-lg p-3 mb-3 ${
        isActive ? "ring-2 ring-terracotta" : ""
      }`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="tappable w-full text-left flex items-start justify-between gap-2"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[10px] font-bold tracking-widest text-charcoal/60 uppercase">
              {phase.focusLabel}
            </span>
            {isActive && (
              <span className="bg-terracotta text-cream text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded">
                ACTIVE
              </span>
            )}
          </div>
          <div className="font-bold text-charcoal">{phase.name}</div>
          <div className="text-[11px] text-charcoal/60 italic">{phase.subtitle}</div>
          <div className="text-[11px] text-charcoal/60 mt-1">
            {phase.dateRange}
            {isActive && dayN ? ` · Day ${dayN} of ${total}` : ""}
          </div>
        </div>
        <div className="text-charcoal/40 text-xs flex-shrink-0">{open ? "▲" : "▼"}</div>
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
          <Detail label="Purpose">
            <p className="text-xs text-charcoal/80 leading-relaxed">{phase.purpose}</p>
          </Detail>

          <Detail label="Training split">
            <p className="text-xs text-charcoal/80">{phase.trainingSplit}</p>
          </Detail>

          <Detail label="Vertical goal">
            <p className="text-xs text-charcoal/80">{phase.verticalGoal}</p>
          </Detail>

          <Detail label="Macros">
            <div className="space-y-1.5">
              {Object.entries(phase.macros).map(([key, block]) => (
                <div key={key} className="bg-cream/40 rounded px-2 py-1.5 text-xs">
                  <div className="font-semibold text-charcoal">
                    {prettyKey(key)}{block.dates ? ` (${block.dates})` : ""}
                  </div>
                  <div className="font-mono text-charcoal/70">
                    {block.cal} cal · P {block.p} · F {block.f} · C {block.c}
                  </div>
                </div>
              ))}
            </div>
          </Detail>

          {milestones.length > 0 && (
            <Detail label="End-of-phase milestones">
              <div className="grid grid-cols-2 gap-1.5">
                {milestones.map((m) => (
                  <div key={m.id} className="bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-xs">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-900/70">
                      {m.metric.replace(/_/g, " ")}
                    </div>
                    <div className="font-mono font-bold text-emerald-900">
                      {m.target_value} {m.target_unit ?? ""}
                    </div>
                  </div>
                ))}
              </div>
            </Detail>
          )}

          {tests.length > 0 && (
            <Detail label={`Scheduled tests (${tests.length})`}>
              <div className="space-y-1.5">
                {tests.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-start gap-2 rounded px-2 py-1.5 text-xs ${
                      t.completed ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-charcoal">{t.test_label}</div>
                      <div className="text-[11px] text-charcoal/60">
                        {displayShort(t.scheduled_date)}
                        {t.target_value ? ` · ${t.target_value}` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => markTestCompleted(t.id, !t.completed)}
                      className={`tappable text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                        t.completed
                          ? "bg-white border border-emerald-300 text-emerald-700"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {t.completed ? "✓ Done" : "Mark done"}
                    </button>
                  </div>
                ))}
              </div>
            </Detail>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-widest text-charcoal/60 uppercase mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}

function prettyKey(k: string): string {
  return k.replace(/_/g, " ");
}
