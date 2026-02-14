"use client";

import { PageHeader } from "@/components/page-header";
import { DemoControlCard } from "@/components/demo-control-card";
import {
  Database,
  TruckIcon,
  AlertTriangle,
  Ship,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DemoControlPage() {
  // Action: Load Demo Traffic Data
  const loadTrafficData = async () => {
    const response = await fetch("/api/seed-traffic", {
      method: "POST",
    });
    const data = await response.json();
    return {
      success: data.success,
      message: data.success
        ? `Generated ${data.message.split(" ")[1]} traffic records`
        : data.message,
      data: data.latest,
    };
  };

  // Action: Create Demo Jobs
  const createDemoJobs = async () => {
    const response = await fetch("/api/demo/create-jobs", {
      method: "POST",
    });
    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
      data: data.data,
    };
  };

  // Action: Trigger Congestion Alert
  const triggerCongestion = async () => {
    const response = await fetch("/api/traffic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        camera_id: "CAM_01_KING_ABDULAZIZ",
        timestamp: new Date().toISOString(),
        status: "CONGESTED",
        vehicle_count: 180,
        truck_count: 25,
        recommendation: "DEMO: Halt NORMAL/LOW priority permits",
      }),
    });
    const data = await response.json();
    return {
      success: data.success,
      message: data.success
        ? `Congestion triggered! ${data.permits_affected} halted, ${data.permits_protected} protected`
        : data.message,
      data: {
        halted: data.permits_affected,
        protected: data.permits_protected,
      },
    };
  };

  // Action: Simulate Vessel Arrival
  const simulateVessel = async () => {
    const response = await fetch("/api/demo/create-vessel", {
      method: "POST",
    });
    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
      data: data.data,
    };
  };

  // Action: Auto-Assign All Jobs (Bulk)
  const autoAssignJobs = async () => {
    // Session check disabled for hackathon demo
    // const sessionCookie = document.cookie
    //   .split("; ")
    //   .find((row) => row.startsWith("org_session="));

    // if (!sessionCookie) {
    //   return {
    //     success: false,
    //     message:
    //       "No organization session found. Please login to org portal first.",
    //   };
    // }

    const response = await fetch("/api/org/jobs/bulk-auto-assign", {
      method: "POST",
    });
    const data = await response.json();
    return {
      success: data.success,
      message: data.success
        ? `Auto-assigned jobs! ${data.assigned_count}/${data.total} successful`
        : data.message,
      data: {
        total: data.total,
        assigned: data.assigned_count,
        failed: data.failed_count,
      },
    };
  };

  // Action: Reset Demo Data
  const resetDemoData = async () => {
    const response = await fetch("/api/demo/reset", {
      method: "POST",
    });
    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
      data: data.data,
    };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demo Control Center"
        description="Trigger demo scenarios with one click for presentations"
      />

      {/* Live Demo Warning */}
      <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Presentation Mode Active
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-600 dark:text-amber-300">
          <p>
            These controls trigger live demo scenarios. Use during hackathon
            presentations to demonstrate PORTA's priority protection system,
            vessel prediction, and intelligent scheduling capabilities.
          </p>
        </CardContent>
      </Card>

      {/* Demo Control Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <DemoControlCard
          icon={Database}
          title="Load Demo Traffic Data"
          description="Generate 48 hours of realistic traffic data with peak hours (7-9 AM, 4-6 PM). Creates 96 records at 30-min intervals."
          action={loadTrafficData}
          actionLabel="Generate Traffic Data"
        />

        <DemoControlCard
          icon={Ship}
          title="Simulate Vessel Arrival"
          description="Create vessel arriving tomorrow at 8:00 AM with 560 estimated trucks. Adjusts slot capacities for predicted 10am-2pm surge."
          action={simulateVessel}
          actionLabel="Create Vessel Schedule"
        />

        <DemoControlCard
          icon={TruckIcon}
          title="Create Demo Jobs"
          description="Create 22 sample jobs with mixed priorities: 4 EMERGENCY, 6 ESSENTIAL, 8 NORMAL, 4 LOW. Shows vessel warnings for congested dates."
          action={createDemoJobs}
          actionLabel="Create 22 Jobs"
        />

        <DemoControlCard
          icon={AlertTriangle}
          title="Trigger Congestion Alert"
          description="Send CONGESTED status (180 vehicles) to trigger automatic permit halting. NORMAL/LOW halted, EMERGENCY/ESSENTIAL protected."
          action={triggerCongestion}
          actionLabel="Trigger Congestion"
          variant="destructive"
        />

        <DemoControlCard
          icon={PlayCircle}
          title="Auto-Assign All Jobs"
          description="Bulk auto-assign all pending jobs. Finds best available drivers, generates permits with QR codes, sends notifications."
          action={autoAssignJobs}
          actionLabel="Auto-Assign Jobs"
        />

        <DemoControlCard
          icon={RotateCcw}
          title="Reset Demo Data"
          description="Clear all demo jobs, permits, vessels. Reset driver availability and time slot capacities. Fresh start for next demo run."
          action={resetDemoData}
          actionLabel="Reset Data"
          variant="outline"
        />
      </div>

      {/* Demo Flow Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Demo Flow (12 minutes)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Setup (1 min)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Click "Reset Demo Data" for fresh start</li>
              <li>Click "Load Demo Traffic Data" to populate 48h history</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Act 1: The Problem (2 min)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                Navigate to /demo - Show traffic comparison (171 vs 60
                trucks/hour)
              </li>
              <li>Explain vessel arrival creates surge</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Act 2: PORTA Solution (3 min)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                Click "Simulate Vessel Arrival" - Show tomorrow 8am arrival
              </li>
              <li>
                Click "Create Demo Jobs" - Creates 10 jobs with vessel warnings
              </li>
              <li>Navigate to /org/jobs - Show pending jobs list</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">
              Act 3: Intelligent Assignment (2 min)
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Click "Auto-Assign All Jobs" - Watch bulk assignment</li>
              <li>Show job details with permit codes and timeline</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">
              Act 4: Priority Protection (3 min)
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                Click "Trigger Congestion Alert" - Halts NORMAL/LOW permits
              </li>
              <li>Navigate to /dashboard/permits - Filter by status</li>
              <li>Show EMERGENCY permits still APPROVED (protected)</li>
              <li>
                Navigate to /dashboard/analytics - Show before/after chart
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Act 5: Results (1 min)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Show dashboard stats: protected permit count</li>
              <li>
                Final message: 65% peak reduction, 100% EMERGENCY protected
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
