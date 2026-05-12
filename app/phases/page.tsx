"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import { getAllPhases, setActivePhase, type Phase } from "@/lib/phases";

const ICON_FOR: Record<string, string> = {
  cut: "✂️",
  vacation: "🌴",
  bulk: "💪",
};

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export default function PhasesPage() {
  const { person } = useProfile();
  const { refresh } = usePhase();
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const ps = await getAllPhases(person);
    setPhases(ps);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person]);

  async function activate(id: string) {
    await setActivePhase(person, id);
    setConfirmId(null);
    await load();
    refresh();
  }

  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-1">Phase History</h1>
      <p className="text-sm text-gray-500 mb-6">
        Switch active phase or view past phases.
      </p>

      {phases.length === 0 && (
        <p className="text-sm text-gray-500 italic">No phases yet.</p>
      )}

      {phases.map((p) => (
        <PhaseCard
          key={p.id}
          phase={p}
          onSetActive={() => setConfirmId(p.id)}
        />
      ))}

      {confirmId && (
        <ConfirmModal
          phase={phases.find((p) => p.id === confirmId)!}
          onCancel={() => setConfirmId(null)}
          onConfirm={() => activate(confirmId)}
        />
      )}
    </div>
  );
}

function PhaseCard({
  phase,
  onSetActive,
}: {
  phase: Phase;
  onSetActive: () => void;
}) {
  const icon = ICON_FOR[phase.phase_type] ?? "📋";
  const dateRange = `${fmtDate(phase.start_date)} – ${fmtDate(phase.end_date)}`;
  return (
    <div
      className={`rounded-lg p-4 mb-3 ${
        phase.is_active
          ? "bg-white border-2 border-terracotta"
          : "bg-white/70 border border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl flex-shrink-0">{icon}</span>
            <div className="font-bold text-charcoal truncate">{phase.name}</div>
            {phase.is_active && (
              <span className="text-[10px] font-bold tracking-widest text-terracotta bg-sage px-1.5 py-0.5 rounded">
                ACTIVE
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">{dateRange}</div>
          <div className="text-[10px] uppercase tracking-wider text-charcoal/50 mt-1">
            {phase.phase_type}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          href={`/phases/${phase.id}`}
          className="tappable bg-white border border-sage/30 text-charcoal font-semibold py-2 px-3 rounded-md text-xs"
        >
          View
        </Link>
        {!phase.is_active && (
          <button
            onClick={onSetActive}
            className="tappable bg-sage text-terracotta font-semibold py-2 px-3 rounded-md text-xs"
          >
            Set Active
          </button>
        )}
      </div>
    </div>
  );
}

function ConfirmModal({
  phase,
  onCancel,
  onConfirm,
}: {
  phase: Phase;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl p-5 max-w-md w-full fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-lg font-bold text-charcoal mb-1">Switch active phase?</div>
        <p className="text-sm text-gray-600 mb-4">
          Set <span className="font-semibold">{phase.name}</span> as your active phase?
          This will switch your Today and Progress views to that phase's data.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="tappable flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-md text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="tappable flex-1 bg-sage text-terracotta font-semibold py-2.5 rounded-md text-sm"
          >
            Set Active
          </button>
        </div>
      </div>
    </div>
  );
}
