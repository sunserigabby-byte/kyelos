"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getChecklistForPhase,
  setChecklistItemChecked,
  addChecklistItem,
  deleteChecklistItem,
  type ChecklistItem,
} from "@/lib/goals";

type Props = {
  phaseId: string;
  /** When the phase is locked we hide controls but keep showing items if any. */
  readOnly?: boolean;
};

export default function PhaseChecklist({ phaseId, readOnly }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setItems(await getChecklistForPhase(phaseId));
    setLoaded(true);
  }, [phaseId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`phase_checklist_${phaseId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goal_phase_checklist_items", filter: `phase_id=eq.${phaseId}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [phaseId, load]);

  async function toggle(item: ChecklistItem) {
    // Optimistic flip — Realtime will reconcile.
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, checked: !x.checked } : x)));
    await setChecklistItemChecked(item.id, !item.checked);
  }

  async function remove(id: string) {
    setItems((xs) => xs.filter((x) => x.id !== id));
    await deleteChecklistItem(id);
  }

  async function add() {
    const label = newLabel.trim();
    if (!label) return;
    setAdding(true);
    const nextOrder = items.length > 0 ? items[items.length - 1].sort_order + 1 : 1;
    await addChecklistItem(phaseId, label, nextOrder);
    setNewLabel("");
    setAdding(false);
  }

  if (!loaded) return null;
  if (items.length === 0 && readOnly) return null;

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[11px] font-bold tracking-widest text-charcoal/60 uppercase">
          Checklist
        </div>
        {items.length > 0 && (
          <div className="text-[11px] text-charcoal/60 font-mono">
            {checkedCount} / {items.length}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-xs text-charcoal/50 italic mb-2">
          No items yet.
        </div>
      ) : (
        <ul className="space-y-1.5 mb-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggle(item)}
                disabled={readOnly}
                className="mt-0.5 flex-shrink-0"
              />
              <span
                className={`flex-1 text-sm ${
                  item.checked ? "line-through text-charcoal/40" : "text-charcoal"
                }`}
              >
                {item.label}
              </span>
              {!readOnly && (
                <button
                  onClick={() => remove(item.id)}
                  className="tappable text-gray-400 hover:text-red-500 text-xs flex-shrink-0"
                  aria-label="Remove item"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder="Add an item…"
            className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-xs"
          />
          <button
            onClick={add}
            disabled={adding || !newLabel.trim()}
            className="tappable bg-forest text-terracotta font-semibold py-1 px-2.5 rounded text-[11px] disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
