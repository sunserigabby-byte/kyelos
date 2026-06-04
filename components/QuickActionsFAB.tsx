"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/components/ProfileContext";
import { supabase } from "@/lib/supabase";
import {
  getVisibleGoals,
  getPhasesForGoal,
  activePhaseOf,
  addContribution,
  type Goal,
  type GoalPhase,
} from "@/lib/goals";
import { addIncomeEntry, currentMonthInfo } from "@/lib/income-ramp";
import { todayLocalISO } from "@/lib/local-date";

type Mode = "menu" | "contribution" | "income";

// Global floating "+" button. Available on every route except settings/login.
// Surfaces the 3-4 most common quick actions so tracking is always one tap away.
export default function QuickActionsFAB() {
  const pathname = usePathname();
  const router = useRouter();
  const { person } = useProfile();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [activeFinancialPhase, setActiveFinancialPhase] = useState<{
    goal: Goal;
    phase: GoalPhase;
  } | null>(null);

  // Hide on settings + auth-ish routes (none yet, but keep the hook).
  const hidden = pathname?.startsWith("/settings");

  const refresh = useCallback(async () => {
    const goals = await getVisibleGoals(person);
    const primary = goals.find((g) => g.category === "financial" && g.status === "active");
    if (!primary) {
      setActiveFinancialPhase(null);
      return;
    }
    const phases = await getPhasesForGoal(primary.id);
    const active = activePhaseOf(phases);
    if (active && !active.is_cashflow) {
      setActiveFinancialPhase({ goal: primary, phase: active });
    } else {
      setActiveFinancialPhase(null);
    }
  }, [person]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel(`fab_${person}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_phases" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [person, refresh]);

  function close() {
    setOpen(false);
    setMode("menu");
  }

  if (hidden) return null;

  return (
    <>
      <button
        onClick={() => {
          setMode("menu");
          setOpen(true);
        }}
        className="tappable fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-terracotta text-cream text-3xl font-bold shadow-lg flex items-center justify-center hover:bg-terracotta/90 active:scale-95 transition"
        aria-label="Quick add"
      >
        +
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={close}
        >
          <div
            className="bg-white rounded-2xl p-4 w-full max-w-md fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {mode === "menu" && (
              <Menu
                hasFinancialPhase={!!activeFinancialPhase}
                onLogContribution={() => setMode("contribution")}
                onLogIncome={() => setMode("income")}
                onGoToToday={() => {
                  router.push("/");
                  close();
                }}
                onGoToFinances={() => {
                  router.push("/finances");
                  close();
                }}
                onClose={close}
              />
            )}
            {mode === "contribution" && activeFinancialPhase && (
              <ContributionForm
                goalTitle={activeFinancialPhase.goal.title}
                phase={activeFinancialPhase.phase}
                person={person}
                onSaved={close}
                onCancel={() => setMode("menu")}
              />
            )}
            {mode === "income" && (
              <IncomeForm
                person={person}
                onSaved={close}
                onCancel={() => setMode("menu")}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Menu({
  hasFinancialPhase,
  onLogContribution,
  onLogIncome,
  onGoToToday,
  onGoToFinances,
  onClose,
}: {
  hasFinancialPhase: boolean;
  onLogContribution: () => void;
  onLogIncome: () => void;
  onGoToToday: () => void;
  onGoToFinances: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-base font-bold text-charcoal">Quick add</div>
        <button onClick={onClose} className="text-charcoal/50 text-lg" aria-label="Close">
          ✕
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ActionButton
          icon="💸"
          label="Log contribution"
          sub={hasFinancialPhase ? "Active financial phase" : "No active phase"}
          onClick={onLogContribution}
          disabled={!hasFinancialPhase}
        />
        <ActionButton
          icon="💼"
          label="Log income"
          sub="Side-job earnings"
          onClick={onLogIncome}
        />
        <ActionButton
          icon="📅"
          label="Today"
          sub="Daily checklist"
          onClick={onGoToToday}
        />
        <ActionButton
          icon="💰"
          label="Finances"
          sub="Goal + pace"
          onClick={onGoToFinances}
        />
      </div>
    </>
  );
}

function ActionButton({
  icon,
  label,
  sub,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="tappable text-left bg-white border border-gray-200 hover:bg-gray-50 rounded-lg p-3 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-sm font-bold text-charcoal">{label}</div>
      <div className="text-[11px] text-charcoal/60">{sub}</div>
    </button>
  );
}

function ContributionForm({
  goalTitle,
  phase,
  person,
  onSaved,
  onCancel,
}: {
  goalTitle: string;
  phase: GoalPhase;
  person: "gabby" | "jon";
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayLocalISO());
  const [saving, setSaving] = useState(false);

  async function submit() {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    setSaving(true);
    await addContribution({
      phaseId: phase.id,
      amount: n,
      date,
      note: note.trim() || undefined,
      createdBy: person,
    });
    setSaving(false);
    onSaved();
  }

  return (
    <>
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-base font-bold text-charcoal">Log contribution</div>
        <button onClick={onCancel} className="text-charcoal/50 text-sm">Back</button>
      </div>
      <div className="text-[11px] text-charcoal/60 mb-3">
        {goalTitle} · Phase {phase.phase_number}: {phase.title}
      </div>

      <Label>Amount ($)</Label>
      <input
        type="text"
        inputMode="decimal"
        autoFocus
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
        placeholder="0.00"
        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-3"
      />

      <Label>Date</Label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-3"
      />

      <Label>Note (optional)</Label>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. weekly transfer, asset sale"
        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-4"
      />

      <button
        onClick={submit}
        disabled={saving || !amount}
        className="tappable w-full bg-forest text-terracotta font-semibold py-2.5 rounded-md text-sm disabled:opacity-50"
      >
        {saving ? "Saving…" : "Log it"}
      </button>
    </>
  );
}

function IncomeForm({
  person,
  onSaved,
  onCancel,
}: {
  person: "gabby" | "jon";
  onSaved: () => void;
  onCancel: () => void;
}) {
  const month = currentMonthInfo();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState(todayLocalISO());
  const [whoFor, setWhoFor] = useState<"gabby" | "jon">(person);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    setSaving(true);
    await addIncomeEntry({
      person: whoFor,
      amount: n,
      date,
      source: source.trim() || undefined,
    });
    setSaving(false);
    onSaved();
  }

  return (
    <>
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-base font-bold text-charcoal">Log income</div>
        <button onClick={onCancel} className="text-charcoal/50 text-sm">Back</button>
      </div>
      <div className="text-[11px] text-charcoal/60 mb-3">
        Side-job gross · {month.label} ramp ${month.target.toLocaleString()} each
      </div>

      <Label>Whose income</Label>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {(["gabby", "jon"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setWhoFor(p)}
            className={`tappable rounded-md py-2 text-sm font-semibold ${
              whoFor === p
                ? "bg-forest text-terracotta"
                : "bg-white border border-gray-300 text-gray-700"
            }`}
          >
            {p === "gabby" ? "Gabby" : "Jon"}
          </button>
        ))}
      </div>

      <Label>Amount ($)</Label>
      <input
        type="text"
        inputMode="decimal"
        autoFocus
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
        placeholder="0.00"
        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-3"
      />

      <Label>Date</Label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-3"
      />

      <Label>Source (optional)</Label>
      <input
        type="text"
        value={source}
        onChange={(e) => setSource(e.target.value)}
        placeholder="e.g. coaching, freelance"
        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-4"
      />

      <button
        onClick={submit}
        disabled={saving || !amount}
        className="tappable w-full bg-forest text-terracotta font-semibold py-2.5 rounded-md text-sm disabled:opacity-50"
      >
        {saving ? "Saving…" : "Log it"}
      </button>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-charcoal mb-1">{children}</div>;
}
