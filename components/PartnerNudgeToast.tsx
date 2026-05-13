"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Person } from "@/lib/plan-data";
import { showNotification } from "@/lib/notifications";

type Nudge = {
  id: string;
  message: string;
};

type Props = {
  person: Person;
};

export default function PartnerNudgeToast({ person }: Props) {
  const [active, setActive] = useState<Nudge | null>(null);

  useEffect(() => {
    let mounted = true;

    async function showAndAck(nudge: { id: string; message: string }) {
      if (!mounted) return;
      setActive(nudge);
      showNotification("Partner update", nudge.message);
      // Mark shown=true so it doesn't fire again on remount/refresh
      supabase
        .from("partner_nudges")
        .update({ shown: true })
        .eq("id", nudge.id)
        .then(() => {});
      // Auto-dismiss after 4s
      setTimeout(() => {
        if (mounted) setActive((cur) => (cur?.id === nudge.id ? null : cur));
      }, 4000);
    }

    // Drain any unshown nudges on mount
    async function drainPending() {
      const { data } = await supabase
        .from("partner_nudges")
        .select("id, message")
        .eq("to_person", person)
        .eq("shown", false)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        showAndAck(data[0] as Nudge);
      }
    }
    drainPending();

    const channel = supabase
      .channel(`nudges_${person}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "partner_nudges",
          filter: `to_person=eq.${person}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row && row.shown === false) {
            showAndAck({ id: row.id, message: row.message });
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [person]);

  if (!active) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[70] w-[92%] max-w-md pointer-events-none">
      <div
        className="bg-forest text-white border-2 border-terracotta rounded-lg shadow-lg p-3 nudge-slide pointer-events-auto cursor-pointer"
        onClick={() => setActive(null)}
      >
        <div className="text-[10px] tracking-widest text-terracotta font-bold mb-0.5">
          PARTNER UPDATE
        </div>
        <div className="text-sm">{active.message}</div>
      </div>
      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .nudge-slide {
          animation: slide-down 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
