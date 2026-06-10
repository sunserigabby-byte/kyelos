"use client";

import Link from "next/link";
import StrengthPRTracker from "@/components/StrengthPRTracker";

export default function StrengthPage() {
  return (
    <div>
      <Link href="/fitness" className="text-xs text-charcoal/60 hover:text-charcoal mb-2 inline-block">
        ← Fitness
      </Link>
      <h1 className="text-2xl font-bold text-charcoal mb-1">Strength PRs</h1>
      <p className="text-sm text-gray-500 mb-4">
        Per-lift bests with Epley-estimated 1RM.
      </p>
      <StrengthPRTracker />
    </div>
  );
}
