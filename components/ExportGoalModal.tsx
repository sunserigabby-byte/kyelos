"use client";

import { useMemo, useState } from "react";
import {
  overallProgress,
  phaseProgress,
  formatPhaseValue,
  paceSummary,
  CATEGORY_META,
  OWNER_LABEL,
  type Goal,
  type GoalPhase,
  type GoalContribution,
  type ChecklistItem,
} from "@/lib/goals";
import { displayWithYear, displayShort, todayLocalISO } from "@/lib/local-date";

type Props = {
  goal: Goal;
  phases: GoalPhase[];
  contributions: GoalContribution[];
  checklist: ChecklistItem[];
  onClose: () => void;
};

export default function ExportGoalModal({ goal, phases, contributions, checklist, onClose }: Props) {
  const md = useMemo(
    () => buildMarkdown(goal, phases, contributions, checklist),
    [goal, phases, contributions, checklist]
  );
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback — select the textarea so user can copy manually.
      const el = document.getElementById("export-textarea") as HTMLTextAreaElement | null;
      el?.select();
    }
  }

  function download() {
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = goal.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    a.href = url;
    a.download = `${slug}-${todayLocalISO()}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-5 max-w-2xl w-full max-h-[90vh] flex flex-col fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-lg font-bold text-charcoal">Export progress summary</div>
          <button
            onClick={onClose}
            className="tappable text-charcoal/50 hover:text-charcoal text-lg"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-charcoal/60 mb-3">
          Markdown summary — paste into a doc, message, or email.
        </p>

        <textarea
          id="export-textarea"
          value={md}
          readOnly
          className="flex-1 w-full bg-cream/40 border border-gray-200 rounded p-3 text-xs font-mono text-charcoal resize-none min-h-[300px]"
        />

        <div className="flex gap-2 mt-3">
          <button
            onClick={onClose}
            className="tappable flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-md text-sm"
          >
            Close
          </button>
          <button
            onClick={download}
            className="tappable flex-1 bg-white border border-forest/30 text-charcoal font-semibold py-2.5 rounded-md text-sm"
          >
            Download .md
          </button>
          <button
            onClick={copy}
            className="tappable flex-1 bg-forest text-terracotta font-semibold py-2.5 rounded-md text-sm"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

function buildMarkdown(
  goal: Goal,
  phases: GoalPhase[],
  contributions: GoalContribution[],
  checklist: ChecklistItem[]
): string {
  const meta = CATEGORY_META[goal.category];
  const overall = Math.round(overallProgress(phases) * 100);
  const pace = paceSummary(goal, phases);
  const totalContributed = contributions.reduce((s, c) => s + Number(c.amount), 0);

  const lines: string[] = [];
  lines.push(`# ${meta.icon} ${goal.title}`);
  lines.push("");
  lines.push(`**Generated:** ${displayWithYear(todayLocalISO())}`);
  lines.push(`**Owner:** ${OWNER_LABEL[goal.owner]}`);
  lines.push(`**Category:** ${meta.label}`);
  lines.push(`**Status:** ${goal.status.toUpperCase()}`);
  lines.push(`**Priority:** ${goal.priority.toUpperCase()}`);
  lines.push(
    `**Timeline:** ${displayWithYear(goal.start_date)}${
      goal.target_date ? ` → ${displayWithYear(goal.target_date)}` : " → ongoing"
    }`
  );
  lines.push(`**Overall progress:** ${overall}%`);
  lines.push(`**Total contributed:** $${Math.round(totalContributed).toLocaleString()}`);
  if (pace) lines.push(`**Pace:** ${pace.message}`);
  if (goal.notes) {
    lines.push("");
    lines.push("## Notes");
    lines.push(goal.notes);
  }

  lines.push("");
  lines.push("## Phases");
  for (const p of phases) {
    const pct = Math.round(phaseProgress(p) * 100);
    lines.push("");
    lines.push(
      `### Phase ${p.phase_number}: ${p.title} ${
        p.status === "complete" ? "✓" : p.status === "active" ? "← ACTIVE" : "🔒"
      }`
    );
    if (p.is_cashflow) {
      lines.push(`- Type: cashflow phase (${p.status === "complete" ? "covered" : "pending"})`);
    } else {
      lines.push(
        `- Progress: ${formatPhaseValue(p.current_value, p.unit)} / ${formatPhaseValue(p.target_value, p.unit)} (${pct}%)`
      );
    }
    if (p.monthly_contribution_target) {
      lines.push(`- Monthly target: $${Math.round(Number(p.monthly_contribution_target)).toLocaleString()}/mo`);
    }
    if (p.description) {
      lines.push("");
      lines.push(p.description);
    }
    const phaseChecklist = checklist.filter((c) => c.phase_id === p.id);
    if (phaseChecklist.length > 0) {
      lines.push("");
      lines.push("**Checklist:**");
      for (const item of phaseChecklist) {
        lines.push(`- [${item.checked ? "x" : " "}] ${item.label}`);
      }
    }
    const phaseContribs = contributions.filter((c) => c.phase_id === p.id);
    if (phaseContribs.length > 0) {
      const phaseTotal = phaseContribs.reduce((s, c) => s + Number(c.amount), 0);
      lines.push("");
      lines.push(`**Contributions:** $${Math.round(phaseTotal).toLocaleString()} across ${phaseContribs.length} entr${phaseContribs.length === 1 ? "y" : "ies"}`);
    }
  }

  if (contributions.length > 0) {
    lines.push("");
    lines.push("## Recent contributions");
    for (const c of contributions.slice(0, 20)) {
      const ph = phases.find((p) => p.id === c.phase_id);
      const byline = c.created_by === "gabby" ? "Gabby" : "Jon";
      const phaseLabel = ph ? `P${ph.phase_number}` : "—";
      const note = c.note ? ` — ${c.note}` : "";
      lines.push(
        `- ${displayShort(c.date)} · $${Math.round(Number(c.amount)).toLocaleString()} (${byline} / ${phaseLabel})${note}`
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}
