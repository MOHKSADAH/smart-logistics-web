"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AutoAssignButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAutoAssign = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/org/jobs/${jobId}/auto-assign`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        router.refresh();
      } else {
        alert(data.error || "Auto-assign failed");
      }
    } catch (error) {
      alert("Error: " + error);
    }
    setLoading(false);
  };

  return (
    <Button
      onClick={handleAutoAssign}
      disabled={loading}
      size="sm"
      variant="default"
    >
      {loading ? "Assigning..." : "Auto-Assign"}
    </Button>
  );
}
