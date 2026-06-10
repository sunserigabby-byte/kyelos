"use client";

import Link from "next/link";
import VerticalJumpTracker from "@/components/VerticalJumpTracker";

export default function VerticalPage() {
  return (
    <div>
      <Link href="/fitness" className="text-xs text-charcoal/60 hover:text-charcoal mb-2 inline-block">
        ← Fitness
      </Link>
      <h1 className="text-2xl font-bold text-charcoal mb-1">Vertical Jump</h1>
      <p className="text-sm text-gray-500 mb-4">
        Standing, approach, max touch, and CMJ over time.
      </p>
      <VerticalJumpTracker />
    </div>
  );
}
