'use client';

import { Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePresentationMode } from "@/lib/presentation-store";
import { useEffect } from "react";

export function PresentationModeToggle() {
  const { isEnabled, togglePresentation } = usePresentationMode();

  useEffect(() => {
    // Add/remove presentation class to body
    if (isEnabled) {
      document.body.classList.add('presentation-mode');
      console.log('Presentation mode: ON');
    } else {
      document.body.classList.remove('presentation-mode');
      console.log('Presentation mode: OFF');
    }
  }, [isEnabled]);

  return (
    <Button
      variant={isEnabled ? "default" : "outline"}
      size="sm"
      onClick={togglePresentation}
      className="gap-2"
    >
      <Monitor className="h-4 w-4" />
      Presentation Mode
      {isEnabled && <span className="ml-1 text-xs">ON</span>}
    </Button>
  );
}
