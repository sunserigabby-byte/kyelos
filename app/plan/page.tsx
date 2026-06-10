"use client";

import TodayBadge from "@/components/TodayBadge";
import PhaseRoadmap from "@/components/PhaseRoadmap";
import LongRangeGoalsCard from "@/components/LongRangeGoalsCard";
import MilestoneCard from "@/components/MilestoneCard";

export default function PlanPage() {
  return (
    <div>
      <TodayBadge />
      <h1 className="text-2xl font-bold text-charcoal mb-1">Plan</h1>
      <p className="text-sm text-gray-500 mb-4">
        Six phases, 188 days, one goal: 128 lbs / 18% / 99 muscle and approach
        vertical 29″ by Dec 13.
      </p>

      <MilestoneCard />
      <LongRangeGoalsCard />

      <PhaseRoadmap />
    </div>
  );
}
