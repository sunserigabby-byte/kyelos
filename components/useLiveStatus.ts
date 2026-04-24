"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useLiveStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase.channel("presence-check");
    channel
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { isConnected };
}
