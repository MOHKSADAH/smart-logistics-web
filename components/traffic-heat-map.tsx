"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Ship, Truck } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface TrafficDataPoint {
  hour: number;
  status: "NORMAL" | "MODERATE" | "CONGESTED";
  vehicleCount: number;
  truckCount: number;
}

interface VesselArrival {
  hour: number;
  vesselName: string;
  estimatedTrucks: number;
}

interface TrafficHeatMapProps {
  data?: TrafficDataPoint[];
  vessels?: VesselArrival[];
  showCurrentTime?: boolean;
}

export function TrafficHeatMap({
  data = generateMockData(),
  vessels = [],
  showCurrentTime = true,
}: TrafficHeatMapProps) {
  const t = useTranslations("status");
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  useEffect(() => {
    if (!showCurrentTime) return;

    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [showCurrentTime]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONGESTED":
        return "bg-red-600 dark:bg-red-500";
      case "MODERATE":
        return "bg-amber-500 dark:bg-amber-400";
      case "NORMAL":
      default:
        return "bg-emerald-500 dark:bg-emerald-400";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "CONGESTED":
        return "text-red-600";
      case "MODERATE":
        return "text-yellow-600";
      case "NORMAL":
      default:
        return "text-green-600";
    }
  };

  const getBarHeight = (count: number) => {
    const maxCount = Math.max(...data.map((d) => d.vehicleCount), 1); // Prevent division by zero
    const percentage = (count / maxCount) * 100;
    // Ensure minimum height of 15% for better visibility
    return Math.max(percentage, count > 0 ? 15 : 0);
  };

  const hoveredData = hoveredHour !== null ? data.find((d) => d.hour === hoveredHour) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          24-Hour Traffic Heat Map
        </CardTitle>
        <CardDescription>
          Real-time traffic patterns with vessel arrival impact zones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Heat Map Visualization */}
          <div className="relative h-80 bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-6 border-2 shadow-lg">
            {/* Hour Labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-6 pb-3 text-sm font-semibold text-foreground">
              {[0, 6, 12, 18, 23].map((hour) => (
                <span key={hour} className="min-w-[40px] text-center">{hour}:00</span>
              ))}
            </div>

            {/* Traffic Bars */}
            <div className="absolute top-6 left-6 right-6 bottom-12 flex items-end justify-between gap-0.5">
              {data.map((point) => {
                const isCurrentHour = showCurrentTime && point.hour === currentHour;
                const isHovered = hoveredHour === point.hour;
                const barHeight = getBarHeight(point.vehicleCount);

                const hasVessel = vessels.some((v) => v.hour === point.hour);

                return (
                  <div
                    key={point.hour}
                    className="relative flex-1 flex flex-col items-center"
                    onMouseEnter={() => setHoveredHour(point.hour)}
                    onMouseLeave={() => setHoveredHour(null)}
                  >
                    {/* Traffic Bar Container */}
                    <div className="w-full h-full flex flex-col items-center justify-end relative">
                      {/* Vessel Arrival Background Highlight */}
                      {hasVessel && (
                        <div className="absolute inset-0 bg-blue-500/10 border-x-2 border-blue-400 rounded-t-lg" />
                      )}

                      {/* Current Hour Background */}
                      {isCurrentHour && (
                        <div className="absolute inset-0 bg-blue-600/20 rounded-t-lg animate-pulse" />
                      )}

                      {/* Vehicle Count Label */}
                      {point.vehicleCount > 0 && (
                        <div className={`text-xs font-bold mb-1 z-10 ${isCurrentHour ? 'text-blue-700 dark:text-blue-300' : 'text-foreground/70'}`}>
                          {point.vehicleCount}
                        </div>
                      )}

                      {/* Bar */}
                      <div
                        className={`
                          w-full rounded-t-lg transition-all duration-200 relative z-10
                          ${getStatusColor(point.status)}
                          ${isHovered ? "opacity-100 scale-105 shadow-lg" : "opacity-100"}
                        `}
                        style={{ height: `${barHeight}%`, minHeight: point.vehicleCount > 0 ? "24px" : "4px" }}
                      />

                      {/* Vessel Indicator Badge at Bottom */}
                      {hasVessel && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-md">
                          SHIP
                        </div>
                      )}

                      {/* Current Time Badge */}
                      {isCurrentHour && !hasVessel && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-blue-700 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-md">
                          NOW
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hover Tooltip */}
            {hoveredData && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-popover border-2 rounded-lg shadow-xl p-4 min-w-[220px]">
                <div className="space-y-2">
                  <div className="font-bold text-base">
                    {hoveredData.hour}:00 - {hoveredData.hour + 1}:00
                  </div>
                  <div className={`text-sm font-bold ${getStatusTextColor(hoveredData.status)}`}>
                    {t(hoveredData.status.toLowerCase())}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    Vehicles: {hoveredData.vehicleCount}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    Trucks: {hoveredData.truckCount}
                  </div>
                  {vessels.find((v) => v.hour === hoveredData.hour) && (
                    <div className="pt-2 border-t mt-2">
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Ship className="h-3 w-3" />
                        Vessel Arrival
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {vessels.find((v) => v.hour === hoveredData.hour)?.vesselName}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-emerald-500 rounded shadow-sm" />
                <span>{t("normal")} (&lt;100)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-amber-500 rounded shadow-sm" />
                <span>{t("moderate")} (100-150)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-red-600 rounded shadow-sm" />
                <span>{t("congested")} (&gt;150)</span>
              </div>
            </div>
            {vessels.length > 0 && (
              <div className="flex items-center gap-2 text-blue-600">
                <Ship className="h-4 w-4" />
                <span>Vessel Arrivals</span>
              </div>
            )}
          </div>

          {/* Vessel Impact Zones */}
          {vessels.length > 0 && (
            <div className="space-y-3 pt-4 border-t-2">
              <h4 className="text-base font-bold flex items-center gap-2">
                <Ship className="h-5 w-5 text-blue-600" />
                Predicted Surge Zones
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {vessels.map((vessel, idx) => {
                  const surgeStart = vessel.hour + 2;
                  const surgeEnd = vessel.hour + 6;
                  return (
                    <div
                      key={idx}
                      className="text-sm p-3 bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800 rounded-lg shadow-sm"
                    >
                      <div className="font-bold text-foreground">{vessel.vesselName}</div>
                      <div className="text-muted-foreground font-medium mt-1">
                        Surge: {surgeStart}:00 - {surgeEnd}:00
                      </div>
                      <div className="text-red-600 dark:text-red-400 font-bold mt-1">
                        ~{vessel.estimatedTrucks} trucks
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Generate mock data for demonstration
function generateMockData(): TrafficDataPoint[] {
  const data: TrafficDataPoint[] = [];

  for (let hour = 0; hour < 24; hour++) {
    let vehicleCount = 50; // Base count
    let truckCount = 5;
    let status: "NORMAL" | "MODERATE" | "CONGESTED" = "NORMAL";

    // Morning rush (7-9 AM)
    if (hour >= 7 && hour <= 9) {
      vehicleCount = 120 + Math.floor(Math.random() * 30);
      truckCount = 15 + Math.floor(Math.random() * 10);
      status = "MODERATE";
    }

    // Peak congestion from vessel arrivals (10 AM - 2 PM)
    if (hour >= 10 && hour <= 13) {
      vehicleCount = 160 + Math.floor(Math.random() * 40);
      truckCount = 25 + Math.floor(Math.random() * 15);
      status = "CONGESTED";
    }

    // Afternoon (2-6 PM)
    if (hour >= 14 && hour <= 17) {
      vehicleCount = 110 + Math.floor(Math.random() * 20);
      truckCount = 12 + Math.floor(Math.random() * 8);
      status = "MODERATE";
    }

    // Evening rush (4-6 PM)
    if (hour >= 16 && hour <= 18) {
      vehicleCount = 130 + Math.floor(Math.random() * 25);
      truckCount = 18 + Math.floor(Math.random() * 10);
      status = "MODERATE";
    }

    // Night shift (distributed load with PORTA)
    if (hour >= 0 && hour <= 6) {
      vehicleCount = 70 + Math.floor(Math.random() * 20);
      truckCount = 8 + Math.floor(Math.random() * 5);
      status = "NORMAL";
    }

    data.push({
      hour,
      status,
      vehicleCount,
      truckCount,
    });
  }

  return data;
}
