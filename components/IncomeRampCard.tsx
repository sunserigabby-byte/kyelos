"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import {
  addIncomeEntry,
  deleteIncomeEntry,
  getMonthlyTotal,
  listMonthEntries,
  currentMonthInfo,
  nextMonthInfo,
  taxReserveFor,
  type IncomeEntry,
  type Person,
} from "@/lib/income-ramp";
import { todayLocalISO, displayShort } from "@/lib/local-date";

type Totals = { gabby: number; jon: number };

export default function IncomeRampCard() {
  const month = currentMonthInfo();
  const next  = nextMonthInfo(month.yyyyMm);
  const target = month.target;
  const combinedTarget = target * 2;

  const [totals, setTotals] = useState<Totals>({ gabby: 0, jon: 0 });
  const [openLog, setOpenLog] = useState<Person | null>(null);
  const [adding, setAdding] = useState<Person | null>(null);

  const load = useCallback(async () => {
    const [g, j] = await Promise.all([
      getMonthlyTotal("gabby", month.yyyyMm),
      getMonthlyTotal("jon",   month.yyyyMm),
    ]);
    setTotals({ gabby: g, jon: j });
  }, [month.yyyyMm]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("income_ramp_card")
      .on("postgres_changes", { event: "*", schema: "public", table: "income_entries" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const combined = totals.gabby + totals.jon;
  const combinedPct = combinedTarget > 0 ? Math.min(100, Math.round((combined / combinedTarget) * 100)) : 0;
  const taxReserve = taxReserveFor(combinedTarget);

  return (
    <div className="bg-white border border-gray-200 border-l-4 border-l-emerald-500 rounded-lg p-4 mb-4">
      <div className="flex items-baseline justify-between mb-1">
        <div className="font-bold text-charcoal text-base">💼 Side Income Ramp · {month.label}</div>
        <div className="text-xs font-mono text-charcoal/70">
          ${Math.round(combined).toLocaleString()} / ${combinedTarget.toLocaleString()}
        </div>
      </div>
      <div className="h-1.5 bg-forest/10 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-emerald-500" style={{ width: `${combinedPct}%` }} />
      </div>

      <PersonRow
        person="gabby"
        total={totals.gabby}
        target={target}
        onAdd={() => setAdding("gabby")}
        onView={() => setOpenLog((p) => (p === "gabby" ? null : "gabby"))}
        logOpen={openLog === "gabby"}
      />
      <PersonRow
        person="jon"
        total={totals.jon}
        target={target}
        onAdd={() => setAdding("jon")}
        onView={() => setOpenLog((p) => (p === "jon" ? null : "jon"))}
        logOpen={openLog === "jon"}
      />

      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-charcoal/70">
        <span>
          Tax reserve:{" "}
          <span className="font-bold text-charcoal">~${taxReserve.toLocaleString()}/mo</span> (~20%)
        </span>
        {next.target !== target && (
          <span>
            Next month: <span className="font-bold text-charcoal">${next.target.toLocaleString()} each</span> ({next.label})
          </span>
        )}
      </div>

      {adding && (
        <AddIncomeModal
          person={adding}
          onCancel={() => setAdding(null)}
          onSaved={() => setAdding(null)}
        />
      )}
    </div>
  );
}

function PersonRow({
  person,
  total,
  target,
  onAdd,
  onView,
  logOpen,
}: {
  person: Person;
  total: number;
  target: number;
  onAdd: () => void;
  onView: () => void;
  logOpen: boolean;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;
  const label = person === "gabby" ? "Gabby" : "Jon";

  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-sm font-semibold text-charcoal">{label}</div>
        <div className="text-xs font-mono text-charcoal/70">
          ${Math.round(total).toLocaleString()} / ${target.toLocaleString()} · {pct}%
        </div>
      </div>
      <div className="h-1.5 bg-forest/10 rounded-full overflow-hidden mb-1.5">
        <div className="h-full bg-forest" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2 items-center">
        <button
          onClick={onAdd}
          className="tappable bg-forest text-terracotta font-semibold py-1 px-2 rounded text-[11px]"
        >
          + Add
        </button>
        <button
          onClick={onView}
          className="tappable text-[11px] text-charcoal/60 hover:text-charcoal underline-offset-2 hover:underline"
        >
          {logOpen ? "Hide log" : "View log"}
        </button>
      </div>
      {logOpen && <EntryLog person={person} />}
    </div>
  );
}

function EntryLog({ person }: { person: Person }) {
  const yyyyMm = currentMonthInfo().yyyyMm;
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    setEntries(await listMonthEntries(person, yyyyMm));
    setLoaded(true);
  }, [person, yyyyMm]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel(`income_log_${person}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "income_entries" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [person, refresh]);

  if (!loaded) return null;
  if (entries.length === 0) {
    return (
      <div className="mt-2 ml-1 text-[11px] text-charcoal/50 italic">
        No entries this month yet.
      </div>
    );
  }
  return (
    <div className="mt-2 ml-1 space-y-1">
      {entries.map((e) => (
        <div
          key={e.id}
          className="flex items-baseline justify-between gap-2 text-[11px] bg-cream/40 rounded px-2 py-1"
        >
          <div className="min-w-0 flex-1">
            <span className="font-mono font-bold text-charcoal">
              ${Math.round(Number(e.amount)).toLocaleString()}
            </span>{" "}
            <span className="text-charcoal/60">· {displayShort(e.date)}</span>
            {e.source && <span className="text-charcoal/60"> · {e.source}</span>}
            {e.note && <span className="text-charcoal/70 italic"> "{e.note}"</span>}
          </div>
          <button
            onClick={() => deleteIncomeEntry(e.id)}
            className="text-gray-400 hover:text-red-500 text-xs flex-shrink-0"
            aria-label="Delete entry"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function AddIncomeModal({
  person,
  onCancel,
  onSaved,
}: {
  person: Person;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayLocalISO());
  const [saving, setSaving] = useState(false);
  const label = person === "gabby" ? "Gabby" : "Jon";

  async function submit() {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    setSaving(true);
    await addIncomeEntry({
      person,
      amount: n,
      date,
      source: source.trim() || undefined,
      note: note.trim() || undefined,
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div className="bg-white rounded-xl p-5 max-w-md w-full fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-bold text-charcoal mb-1">Log side income</div>
        <div className="text-xs text-charcoal/60 mb-4">{label} · gross (pre-tax)</div>

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
          placeholder="e.g. coaching session, freelance, tutoring"
          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-3"
        />

        <Label>Note (optional)</Label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
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

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-charcoal mb-1">{children}</div>;
}
