"use client";

import { useEffect, useState } from "react";
import GoalForm from "@/components/GoalForm";
import { getGoalById, getPhasesForGoal, type DraftGoal } from "@/lib/goals";

export default function EditGoalPage({ params }: { params: { id: string } }) {
  const [initial, setInitial] = useState<DraftGoal | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const goal = await getGoalById(params.id);
      if (!goal) {
        setNotFound(true);
        return;
      }
      const phases = await getPhasesForGoal(params.id);
      setInitial({
        id: goal.id,
        title: goal.title,
        category: goal.category,
        owner: goal.owner,
        priority: goal.priority,
        start_date: goal.start_date,
        target_date: goal.target_date,
        notes: goal.notes ?? "",
        phases: phases.map((p) => ({
          id: p.id,
          phase_number: p.phase_number,
          title: p.title,
          description: p.description ?? "",
          target_value: Number(p.target_value),
          unit: p.unit,
          is_cashflow: p.is_cashflow,
          monthly_contribution_target: p.monthly_contribution_target
            ? Number(p.monthly_contribution_target)
            : null,
        })),
      });
    })();
  }, [params.id]);

  if (notFound) return <div className="text-center text-gray-500 py-8">Goal not found.</div>;
  if (!initial) return <div className="text-center text-gray-500 py-8">Loading…</div>;
  return <GoalForm mode="edit" initial={initial} />;
}
