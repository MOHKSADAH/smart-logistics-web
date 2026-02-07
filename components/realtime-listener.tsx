"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase";

interface RealtimeListenerProps {
  table: "traffic_updates" | "permits" | "time_slots" | "drivers" | "notifications";
}

export function RealtimeListener({ table }: RealtimeListenerProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    // Subscribe to table changes
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: table,
        },
        (payload) => {
          console.log(`[Realtime] ${table} changed:`, payload);
          // Refresh the current page to get updated data
          router.refresh();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, router]);

  return null; // This component doesn't render anything
}
