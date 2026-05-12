"use client";

import { useState } from "react";

type Props = { dayNum: number };

export default function PhotoPrompt({ dayNum }: Props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-sage-pale border-2 border-terracotta rounded-lg p-3 mb-3">
      <button onClick={() => setExpanded((v) => !v)} className="tappable w-full text-left">
        <div className="font-bold text-charcoal text-sm">📸 Photo Day — Day {dayNum}</div>
        <div className="text-xs text-charcoal/70 mt-0.5">
          Take front/side/back. Same lighting as last time.
        </div>
      </button>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-terracotta/40 text-xs text-charcoal space-y-2">
          <p><strong>Quick tips:</strong></p>
          <ul className="space-y-1 pl-4 list-disc">
            <li>Same time of day (morning, fasted is most consistent)</li>
            <li>Same lighting setup</li>
            <li>Front · Side · Back, neutral pose, relaxed</li>
            <li>Save them to a "PRP Progress" album in your phone</li>
          </ul>
          <p className="text-gray-600 italic">
            Photo upload coming in a future update. For now, keep them in your camera roll.
          </p>
        </div>
      )}
    </div>
  );
}
