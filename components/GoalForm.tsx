"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createGoalWithPhases,
  updateGoalWithPhases,
  CATEGORY_META,
  type DraftGoal,
  type DraftPhase,
  type GoalCategory,
  type GoalOwner,
  type GoalPriority,
} from "@/lib/goals";

type Props = {
  mode: "new" | "edit";
  initial: DraftGoal;
};

export default function GoalForm({ mode, initial }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftGoal>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch<K extends keyof DraftGoal>(key: K, value: DraftGoal[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function patchPhase(idx: number, patch: Partial<DraftPhase>) {
    setDraft((d) => ({
      ...d,
      phases: d.phases.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    }));
  }

  function addPhase() {
    setDraft((d) => ({
      ...d,
      phases: [
        ...d.phases,
        {
          phase_number: d.phases.length + 1,
          title: "",
          description: "",
          target_value: 0,
          unit: "$",
          is_cashflow: false,
          monthly_contribution_target: null,
        },
      ],
    }));
  }

  function removePhase(idx: number) {
    setDraft((d) => ({
      ...d,
      phases: d.phases
        .filter((_, i) => i !== idx)
        .map((p, i) => ({ ...p, phase_number: i + 1 })),
    }));
  }

  function movePhase(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= draft.phases.length) return;
    setDraft((d) => {
      const next = [...d.phases];
      [next[idx], next[j]] = [next[j], next[idx]];
      return { ...d, phases: next.map((p, i) => ({ ...p, phase_number: i + 1 })) };
    });
  }

  async function save() {
    setError(null);
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (draft.phases.length === 0) {
      setError("Add at least one phase.");
      return;
    }
    if (draft.phases.some((p) => !p.title.trim())) {
      setError("Every phase needs a title.");
      return;
    }
    setSaving(true);
    if (mode === "new") {
      const id = await createGoalWithPhases(draft);
      setSaving(false);
      if (id) router.push(`/goals/${id}`);
      else setError("Failed to save. Check the console.");
    } else {
      const ok = await updateGoalWithPhases(draft);
      setSaving(false);
      if (ok && draft.id) router.push(`/goals/${draft.id}`);
      else setError("Failed to update. Check the console.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-1">
        {mode === "new" ? "New Goal" : "Edit Goal"}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Goals can have one or more phases. Phases unlock in order; the first is active.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <Label>Title</Label>
        <Input
          value={draft.title}
          onChange={(v) => patch("title", v)}
          placeholder="e.g. Financial Recovery & Rebuild"
        />

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <Label>Category</Label>
            <Select<GoalCategory>
              value={draft.category}
              onChange={(v) => patch("category", v)}
              options={[
                { value: "financial", label: `${CATEGORY_META.financial.icon} Financial` },
                { value: "fitness",   label: `${CATEGORY_META.fitness.icon} Fitness` },
                { value: "nutrition", label: `${CATEGORY_META.nutrition.icon} Nutrition` },
                { value: "other",     label: `${CATEGORY_META.other.icon} Other` },
              ]}
            />
          </div>
          <div>
            <Label>Owner</Label>
            <Select<GoalOwner>
              value={draft.owner}
              onChange={(v) => patch("owner", v)}
              options={[
                { value: "shared", label: "Shared (both)" },
                { value: "gabby",  label: "Gabby" },
                { value: "jon",    label: "Jon" },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <Label>Priority</Label>
            <Select<GoalPriority>
              value={draft.priority}
              onChange={(v) => patch("priority", v)}
              options={[
                { value: "high",   label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low",    label: "Low" },
              ]}
            />
          </div>
          <div />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <Label>Start date</Label>
            <Input
              type="date"
              value={draft.start_date}
              onChange={(v) => patch("start_date", v)}
            />
          </div>
          <div>
            <Label>Target date (optional)</Label>
            <Input
              type="date"
              value={draft.target_date ?? ""}
              onChange={(v) => patch("target_date", v || null)}
            />
          </div>
        </div>

        <div className="mt-3">
          <Label>Notes (optional)</Label>
          <textarea
            value={draft.notes ?? ""}
            onChange={(e) => patch("notes", e.target.value)}
            rows={4}
            className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Context, funding source, guardrails…"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-charcoal font-bold text-sm uppercase tracking-wider">Phases</div>
        <button
          onClick={addPhase}
          className="tappable bg-white border border-forest/30 text-charcoal font-semibold py-1.5 px-3 rounded-md text-xs"
        >
          + Add Phase
        </button>
      </div>

      {draft.phases.map((p, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-bold tracking-widest text-charcoal/60">
              PHASE {p.phase_number}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => movePhase(i, -1)}
                disabled={i === 0}
                className="tappable text-xs text-charcoal/60 disabled:opacity-30 px-1"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => movePhase(i, 1)}
                disabled={i === draft.phases.length - 1}
                className="tappable text-xs text-charcoal/60 disabled:opacity-30 px-1"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => removePhase(i)}
                className="tappable text-xs text-red-500 ml-1 px-1"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          </div>

          <Label>Title</Label>
          <Input value={p.title} onChange={(v) => patchPhase(i, { title: v })} />

          <div className="mt-2">
            <Label>Description (optional)</Label>
            <textarea
              value={p.description ?? ""}
              onChange={(e) => patchPhase(i, { description: e.target.value })}
              rows={2}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="col-span-2">
              <Label>Target value</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={String(p.target_value)}
                onChange={(v) => patchPhase(i, { target_value: parseFloat(v.replace(/[^\d.]/g, "")) || 0 })}
                disabled={p.is_cashflow}
              />
            </div>
            <div>
              <Label>Unit</Label>
              <Input
                value={p.unit}
                onChange={(v) => patchPhase(i, { unit: v })}
                placeholder="$"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 mt-3 text-xs text-charcoal">
            <input
              type="checkbox"
              checked={p.is_cashflow}
              onChange={(e) =>
                patchPhase(i, {
                  is_cashflow: e.target.checked,
                  unit: e.target.checked ? "status" : p.unit === "status" ? "$" : p.unit,
                })
              }
            />
            <span>
              Cashflow phase (tracked as covered/not, not as an accumulation total)
            </span>
          </label>

          <div className="mt-3">
            <Label>Monthly contribution target (optional)</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={p.monthly_contribution_target ? String(p.monthly_contribution_target) : ""}
              onChange={(v) => {
                const n = parseFloat(v.replace(/[^\d.]/g, ""));
                patchPhase(i, { monthly_contribution_target: Number.isFinite(n) && n > 0 ? n : null });
              }}
              placeholder="e.g. 3000"
            />
            <div className="text-[10px] text-charcoal/50 mt-1">
              Powers the weekly target card (≈ monthly ÷ 4.345).
            </div>
          </div>
        </div>
      ))}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3 mb-3">
          {error}
        </div>
      )}

      <div className="flex gap-2 sticky bottom-3 bg-cream/95 -mx-1 px-1 py-2">
        <button
          onClick={() => router.back()}
          className="tappable flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-md text-sm"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="tappable flex-1 bg-forest text-terracotta font-semibold py-2.5 rounded-md text-sm disabled:opacity-50"
        >
          {saving ? "Saving…" : mode === "new" ? "Create goal" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-charcoal mb-1">{children}</div>;
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "decimal" | "numeric" | "text";
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
    />
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
