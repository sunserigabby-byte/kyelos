"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "@/components/ProfileContext";
import { supabase } from "@/lib/supabase";
import { todayLocalISO, displayWithYear } from "@/lib/local-date";
import TodayBadge from "@/components/TodayBadge";
import PhaseChecklist from "@/components/PhaseChecklist";
import WeeklyContributionCard from "@/components/WeeklyContributionCard";
import {
  getGoalById,
  getPhasesForGoal,
  getContributionsForGoal,
  getChecklistForGoal,
  addContribution,
  deleteContribution,
  completePhase,
  reopenPhase,
  deleteGoal,
  overallProgress,
  phaseProgress,
  paceSummary,
  formatPhaseValue,
  activePhaseOf,
  CATEGORY_META,
  OWNER_LABEL,
  type Goal,
  type GoalPhase,
  type GoalContribution,
  type ChecklistItem,
} from "@/lib/goals";
import ExportGoalModal from "@/components/ExportGoalModal";

const fmtDate = displayWithYear;

export default function GoalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { person } = useProfile();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [phases, setPhases] = useState<GoalPhase[]>([]);
  const [contribs, setContribs] = useState<GoalContribution[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState<{ phaseId: string } | null>(null);
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [g, ps, cs, cl] = await Promise.all([
      getGoalById(params.id),
      getPhasesForGoal(params.id),
      getContributionsForGoal(params.id),
      getChecklistForGoal(params.id),
    ]);
    setGoal(g);
    setPhases(ps);
    setContribs(cs);
    setChecklist(cl);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`goal_detail_${params.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "goals", filter: `id=eq.${params.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_phases", filter: `goal_id=eq.${params.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_contributions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_phase_checklist_items" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id, load]);

  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>;
  if (!goal) return <div className="text-center text-gray-500 py-8">Goal not found.</div>;

  const meta = CATEGORY_META[goal.category];
  const overall = overallProgress(phases);
  const pct = Math.round(overall * 100);
  const active = activePhaseOf(phases);
  const pace = paceSummary(goal, phases);

  async function handleAdd(amount: number, note: string, date: string) {
    if (!addOpen) return;
    await addContribution({
      phaseId: addOpen.phaseId,
      amount,
      date,
      note: note || undefined,
      createdBy: person,
    });
    setAddOpen(null);
  }

  async function handleDeleteGoal() {
    await deleteGoal(goal!.id);
    router.push("/goals");
  }

  return (
    <div>
      <Link href="/goals" className="text-xs text-charcoal/60 hover:text-charcoal mb-2 inline-block">
        ← All goals
      </Link>
      <div>
        <TodayBadge startISO={goal.start_date} context="goal" />
      </div>

      {/* Header card */}
      <div className={`bg-white border border-gray-200 border-l-4 ${meta.accentClass} rounded-lg p-4 mb-4`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{meta.icon}</span>
              <h1 className="text-xl font-bold text-charcoal">{goal.title}</h1>
            </div>
            <div className="text-[11px] text-charcoal/60 flex items-center gap-2">
              <span className="uppercase tracking-wider">{OWNER_LABEL[goal.owner]}</span>
              {goal.priority === "high" && (
                <span className="bg-terracotta/15 text-terracotta font-bold px-1.5 py-0.5 rounded">HIGH</span>
              )}
              {goal.status !== "active" && (
                <span className="bg-gray-200 text-gray-700 font-bold px-1.5 py-0.5 rounded uppercase">
                  {goal.status}
                </span>
              )}
            </div>
            <div className="text-[11px] text-charcoal/60 mt-1">
              {fmtDate(goal.start_date)} {goal.target_date ? `→ ${fmtDate(goal.target_date)}` : "→ ongoing"}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold text-charcoal leading-tight">{pct}%</div>
            <div className="text-[10px] text-charcoal/50 uppercase tracking-wider">overall</div>
          </div>
        </div>

        <div className="h-2 bg-forest/10 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-terracotta transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>

        {pace && (
          <div
            className={`mt-3 text-xs px-3 py-2 rounded ${
              pace.status === "ahead"
                ? "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500"
                : pace.status === "behind"
                ? "bg-amber-50 text-amber-900 border-l-4 border-amber-500"
                : "bg-forest/5 text-charcoal border-l-4 border-forest"
            }`}
          >
            {pace.message}
          </div>
        )}

        {goal.notes && (
          <p className="mt-3 text-sm text-charcoal/80 leading-relaxed whitespace-pre-wrap">
            {goal.notes}
          </p>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 flex-wrap">
          {active && (
            <button
              onClick={() => setAddOpen({ phaseId: active.id })}
              className="tappable bg-forest text-terracotta font-semibold py-2 px-3 rounded-md text-xs"
            >
              + Log Contribution
            </button>
          )}
          <Link
            href={`/goals/${goal.id}/edit`}
            className="tappable bg-white border border-forest/30 text-charcoal font-semibold py-2 px-3 rounded-md text-xs"
          >
            Edit
          </Link>
          <button
            onClick={() => setExportOpen(true)}
            className="tappable bg-white border border-forest/30 text-charcoal font-semibold py-2 px-3 rounded-md text-xs"
          >
            Export
          </button>
          <button
            onClick={() => setConfirmDeleteGoal(true)}
            className="tappable bg-white border border-gray-300 text-gray-600 font-semibold py-2 px-3 rounded-md text-xs ml-auto"
          >
            Delete
          </button>
        </div>
      </div>

      <WeeklyContributionCard goalId={goal.id} />

      {/* Phases */}
      <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3">
        Phases
      </div>
      {phases.map((p) => (
        <PhaseCard
          key={p.id}
          phase={p}
          contribCount={contribs.filter((c) => c.phase_id === p.id).length}
          onAddContribution={() => setAddOpen({ phaseId: p.id })}
          onComplete={() => completePhase(p)}
          onReopen={() => reopenPhase(p)}
        />
      ))}

      {/* Chart */}
      {contribs.length > 0 && (
        <>
          <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3 mt-6">
            Progress Over Time
          </div>
          <ContributionsChart contributions={contribs} />
        </>
      )}

      {/* Log */}
      <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3 mt-6">
        Contribution Log
      </div>
      <ContributionLog contributions={contribs} phases={phases} onDelete={(id) => deleteContribution(id)} />

      {addOpen && (
        <AddContributionModal
          phase={phases.find((p) => p.id === addOpen.phaseId)!}
          onSave={handleAdd}
          onCancel={() => setAddOpen(null)}
        />
      )}

      {confirmDeleteGoal && (
        <ConfirmModal
          title="Delete this goal?"
          body="This deletes the goal, all phases, and every logged contribution. Cannot be undone."
          onCancel={() => setConfirmDeleteGoal(false)}
          onConfirm={handleDeleteGoal}
          danger
        />
      )}

      {exportOpen && (
        <ExportGoalModal
          goal={goal}
          phases={phases}
          contributions={contribs}
          checklist={checklist}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}

function PhaseCard({
  phase,
  contribCount,
  onAddContribution,
  onComplete,
  onReopen,
}: {
  phase: GoalPhase;
  contribCount: number;
  onAddContribution: () => void;
  onComplete: () => void;
  onReopen: () => void;
}) {
  const pct = Math.round(phaseProgress(phase) * 100);
  const isActive = phase.status === "active";
  const isComplete = phase.status === "complete";
  const isLocked = phase.status === "locked";

  return (
    <div
      className={`bg-white rounded-lg p-4 mb-3 border ${
        isActive
          ? "border-2 border-terracotta"
          : isComplete
          ? "border-emerald-300"
          : "border-gray-200 opacity-80"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[10px] font-bold tracking-widest text-charcoal/60">
              PHASE {phase.phase_number}
            </span>
            {isActive && (
              <span className="bg-terracotta text-cream text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">
                ACTIVE
              </span>
            )}
            {isComplete && (
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">
                ✓ COMPLETE
              </span>
            )}
            {isLocked && (
              <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">
                🔒 LOCKED
              </span>
            )}
            {phase.is_cashflow && (
              <span className="bg-forest-pale text-charcoal text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">
                CASHFLOW
              </span>
            )}
          </div>
          <div className="font-bold text-charcoal">{phase.title}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-mono text-xs text-charcoal/70">
            {phase.is_cashflow
              ? formatPhaseValue(phase.current_value, phase.unit)
              : `${formatPhaseValue(phase.current_value, phase.unit)} / ${formatPhaseValue(phase.target_value, phase.unit)}`}
          </div>
          {!phase.is_cashflow && (
            <div className="text-[10px] text-charcoal/50">{pct}%</div>
          )}
        </div>
      </div>

      {!phase.is_cashflow && (
        <div className="h-1.5 bg-forest/10 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-forest" style={{ width: `${pct}%` }} />
        </div>
      )}

      {phase.description && (
        <p className="text-xs text-charcoal/70 leading-relaxed mb-2 whitespace-pre-wrap">
          {phase.description}
        </p>
      )}

      <div className="text-[11px] text-charcoal/50 mb-2">
        {contribCount} contribution{contribCount === 1 ? "" : "s"} logged
      </div>

      <PhaseChecklist phaseId={phase.id} readOnly={isLocked} />

      {!isLocked && (
        <div className="flex gap-2 flex-wrap">
          {!isComplete && !phase.is_cashflow && (
            <button
              onClick={onAddContribution}
              className="tappable bg-forest text-terracotta font-semibold py-1.5 px-2.5 rounded-md text-[11px]"
            >
              + Add
            </button>
          )}
          {!isComplete && (
            <button
              onClick={onComplete}
              className="tappable bg-emerald-600 text-white font-semibold py-1.5 px-2.5 rounded-md text-[11px]"
            >
              ✓ Mark Complete
            </button>
          )}
          {isComplete && (
            <button
              onClick={onReopen}
              className="tappable bg-white border border-gray-300 text-gray-700 font-semibold py-1.5 px-2.5 rounded-md text-[11px]"
            >
              Re-open
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Inline SVG cumulative-progress chart
// ============================================
function ContributionsChart({ contributions }: { contributions: GoalContribution[] }) {
  if (contributions.length === 0) return null;

  // Sort ascending by date for the chart.
  const sorted = [...contributions].sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  const points = sorted.map((c) => {
    running += Number(c.amount);
    return { date: c.date, cumulative: running };
  });

  const firstDate = Date.parse(sorted[0].date + "T00:00:00Z");
  const lastDate = Date.parse(sorted[sorted.length - 1].date + "T00:00:00Z");
  const span = Math.max(1, lastDate - firstDate);
  const maxY = points[points.length - 1].cumulative;

  const w = 320;
  const h = 120;
  const pad = { l: 36, r: 8, t: 8, b: 18 };

  const x = (t: number) =>
    pad.l + ((t - firstDate) / span) * (w - pad.l - pad.r);
  const y = (v: number) =>
    pad.t + (1 - v / Math.max(1, maxY)) * (h - pad.t - pad.b);

  const path = points
    .map((p, i) => {
      const px = x(Date.parse(p.date + "T00:00:00Z"));
      const py = y(p.cumulative);
      return `${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(" ");

  const areaPath = `${path} L ${x(lastDate).toFixed(1)} ${(h - pad.b).toFixed(1)} L ${pad.l.toFixed(1)} ${(h - pad.b).toFixed(1)} Z`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xs text-charcoal/60">Cumulative contributions</div>
        <div className="text-sm font-bold text-charcoal font-mono">
          ${Math.round(maxY).toLocaleString()}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Cumulative contributions over time">
        {/* baseline */}
        <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#e5e7eb" strokeWidth="1" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="#e5e7eb" strokeWidth="1" />
        {/* area + line */}
        <path d={areaPath} fill="#C7785A" fillOpacity="0.15" />
        <path d={path} fill="none" stroke="#C7785A" strokeWidth="2" />
        {/* dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(Date.parse(p.date + "T00:00:00Z"))}
            cy={y(p.cumulative)}
            r="2.5"
            fill="#C7785A"
          />
        ))}
        {/* y label */}
        <text x="4" y={pad.t + 8} fontSize="9" fill="#6b7280">${Math.round(maxY).toLocaleString()}</text>
        <text x="4" y={h - pad.b + 1} fontSize="9" fill="#6b7280">$0</text>
        {/* x labels */}
        <text x={pad.l} y={h - 4} fontSize="9" fill="#6b7280">{shortDate(sorted[0].date)}</text>
        <text x={w - pad.r} y={h - 4} fontSize="9" fill="#6b7280" textAnchor="end">
          {shortDate(sorted[sorted.length - 1].date)}
        </text>
      </svg>
    </div>
  );
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[m - 1]} ${d}`;
}

function ContributionLog({
  contributions,
  phases,
  onDelete,
}: {
  contributions: GoalContribution[];
  phases: GoalPhase[];
  onDelete: (id: string) => Promise<void>;
}) {
  if (contributions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-xs text-charcoal/60 italic">
        No contributions yet. Use the + button on the active phase to log one.
      </div>
    );
  }
  const phaseOf = (id: string) => phases.find((p) => p.id === id);
  return (
    <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
      {contributions.map((c) => {
        const ph = phaseOf(c.phase_id);
        return (
          <div key={c.id} className="p-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-mono font-bold text-charcoal">
                ${Math.round(Number(c.amount)).toLocaleString()}
              </div>
              <div className="text-[11px] text-charcoal/60">
                {fmtDate(c.date)} · by {c.created_by === "gabby" ? "Gabby" : "Jon"}
                {ph ? ` · Phase ${ph.phase_number}` : ""}
              </div>
              {c.note && <div className="text-xs text-charcoal/80 mt-1 italic">"{c.note}"</div>}
            </div>
            <button
              onClick={() => onDelete(c.id)}
              className="tappable text-gray-400 hover:text-red-500 text-xs flex-shrink-0"
              aria-label="Delete contribution"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AddContributionModal({
  phase,
  onSave,
  onCancel,
}: {
  phase: GoalPhase;
  onSave: (amount: number, note: string, date: string) => Promise<void>;
  onCancel: () => void;
}) {
  const today = todayLocalISO();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    setSaving(true);
    await onSave(n, note.trim(), date);
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div className="bg-white rounded-xl p-5 max-w-md w-full fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-bold text-charcoal mb-1">Log contribution</div>
        <div className="text-xs text-charcoal/60 mb-4">
          Phase {phase.phase_number}: {phase.title}
        </div>

        <label className="block text-xs font-semibold text-charcoal mb-1">Amount ($)</label>
        <input
          type="text"
          inputMode="decimal"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="0.00"
          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-3"
        />

        <label className="block text-xs font-semibold text-charcoal mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-3"
        />

        <label className="block text-xs font-semibold text-charcoal mb-1">Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. side-job payout, asset sale, monthly transfer"
          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="tappable flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-md text-sm"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !amount}
            className="tappable flex-1 bg-forest text-terracotta font-semibold py-2.5 rounded-md text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Log it"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  body,
  onCancel,
  onConfirm,
  danger = false,
}: {
  title: string;
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl p-5 max-w-md w-full fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-bold text-charcoal mb-1">{title}</div>
        <p className="text-sm text-gray-600 mb-4">{body}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="tappable flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-md text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`tappable flex-1 font-semibold py-2.5 rounded-md text-sm ${
              danger ? "bg-red-600 text-white" : "bg-forest text-terracotta"
            }`}
          >
            {danger ? "Delete" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
