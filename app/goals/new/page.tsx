"use client";

import GoalForm from "@/components/GoalForm";
import { todayLocalISO } from "@/lib/local-date";
import type { DraftGoal } from "@/lib/goals";

export default function NewGoalPage() {
  const today = todayLocalISO();
  const initial: DraftGoal = {
    title: "",
    category: "other",
    owner: "shared",
    priority: "medium",
    start_date: today,
    target_date: null,
    notes: "",
    phases: [
      { phase_number: 1, title: "", description: "", target_value: 0, unit: "$", is_cashflow: false },
    ],
  };
  return <GoalForm mode="new" initial={initial} />;
}
