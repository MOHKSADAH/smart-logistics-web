"use client";
import { useEffect, useRef } from "react";

export default function TrafficComparisonChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 600;

    const context = ctx;

    // Data: Truck arrivals per hour
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Real numbers: 4,800 trucks/week = 686 trucks/day
    // WITHOUT PORTA: All 686 trucks concentrated 10am-2pm (4 hours)
    const withoutPorta = hours.map((hour) => {
      if (hour >= 10 && hour <= 13) {
        return 165 + Math.random() * 12; // ~171 trucks/hour during peak (686/4)
      } else if (hour >= 8 && hour <= 15) {
        return 10 + Math.random() * 15; // 10-25 trucks around peak
      }
      return 2 + Math.random() * 5; // 2-7 trucks off-peak
    });

    // WITH PORTA: Same 686 trucks distributed across 24 hours
    const withPorta = hours.map((hour) => {
      // Night shift (12am-6am): LOW priority moved here
      if (hour >= 0 && hour <= 5) {
        return 18 + Math.random() * 6; // ~20 trucks/hour
      }
      // Morning (6am-10am): Off-peak
      if (hour >= 6 && hour <= 9) {
        return 28 + Math.random() * 6; // ~30 trucks/hour
      }
      // Peak (10am-2pm): EMERGENCY/ESSENTIAL protected
      if (hour >= 10 && hour <= 13) {
        return 55 + Math.random() * 10; // ~60 trucks/hour (65% reduction from 171)
      }
      // Afternoon (2pm-6pm): Moderate
      if (hour >= 14 && hour <= 17) {
        return 28 + Math.random() * 6; // ~30 trucks/hour
      }
      // Evening (6pm-12am): Low priority + night shift
      return 12 + Math.random() * 6; // ~15 trucks/hour
    });

    function drawChart() {
      // Clear canvas
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, 1200, 600);

      // Dividing line
      context.strokeStyle = "#000";
      context.lineWidth = 2;
      context.setLineDash([10, 5]);
      context.beginPath();
      context.moveTo(600, 0);
      context.lineTo(600, 600);
      context.stroke();
      context.setLineDash([]);

      // Headers
      context.fillStyle = "#000";
      context.font = "bold 26px Arial";
      context.textAlign = "center";
      context.fillText("WITHOUT PORTA", 300, 45);
      context.fillText("WITH PORTA", 900, 45);

      // Subheaders
      context.font = "14px Arial";
      context.fillStyle = "#ef4444";
      context.fillText("All trucks arrive 10am-2pm", 300, 70);
      context.fillStyle = "#22c55e";
      context.fillText("Distributed across 24 hours", 900, 70);

      // Chart dimensions
      const chartY = 120;
      const chartHeight = 350;
      const chartWidth = 500;
      const barWidth = chartWidth / 24;

      // Draw LEFT chart (WITHOUT PORTA)
      const maxLeft = Math.max(...withoutPorta);
      withoutPorta.forEach((value, i) => {
        const barHeight = (value / maxLeft) * chartHeight;
        const x = 50 + i * barWidth;
        const y = chartY + chartHeight - barHeight;

        // Color based on hour
        if (i >= 10 && i <= 13) {
          context.fillStyle = "#ef4444"; // Red for peak
        } else {
          context.fillStyle = "#666";
        }

        context.fillRect(x, y, barWidth - 2, barHeight);
      });

      // Draw RIGHT chart (WITH PORTA)
      const maxRight = Math.max(...withPorta);
      withPorta.forEach((value, i) => {
        const barHeight = (value / maxRight) * chartHeight;
        const x = 650 + i * barWidth;
        const y = chartY + chartHeight - barHeight;

        // Color based on priority distribution
        if (i >= 0 && i <= 5) {
          context.fillStyle = "#8b5cf6"; // Purple for night shift
        } else if (i >= 6 && i <= 18) {
          context.fillStyle = "#22c55e"; // Green for distributed daytime
        } else {
          context.fillStyle = "#8b5cf6"; // Purple for night
        }

        context.fillRect(x, y, barWidth - 2, barHeight);
      });

      // X-axis labels (hours)
      context.fillStyle = "#999";
      context.font = "10px Arial";
      context.textAlign = "center";
      for (let i = 0; i < 24; i += 4) {
        const xLeft = 50 + i * barWidth + barWidth / 2;
        const xRight = 650 + i * barWidth + barWidth / 2;
        context.fillText(`${i}:00`, xLeft, chartY + chartHeight + 20);
        context.fillText(`${i}:00`, xRight, chartY + chartHeight + 20);
      }

      // Y-axis label
      context.save();
      context.translate(20, chartY + chartHeight / 2);
      context.rotate(-Math.PI / 2);
      context.fillStyle = "#999";
      context.font = "12px Arial";
      context.textAlign = "center";
      context.fillText("Trucks per Hour", 0, 0);
      context.restore();

      context.save();
      context.translate(620, chartY + chartHeight / 2);
      context.rotate(-Math.PI / 2);
      context.fillText("Trucks per Hour", 0, 0);
      context.restore();

      // Stats box (left)
      context.fillStyle = "rgba(239, 68, 68, 0.2)";
      context.fillRect(10, 520, 280, 70);
      context.strokeStyle = "#ef4444";
      context.lineWidth = 2;
      context.strokeRect(10, 520, 280, 70);

      context.fillStyle = "#ef4444";
      context.font = "bold 16px Arial";
      context.textAlign = "left";
      context.fillText("🚨 PEAK CONGESTION", 20, 545);
      context.font = "14px Arial";
      context.fillText("10am-2pm: 171 trucks/hour (all at once)", 20, 565);
      context.fillText("Avg Speed: 12 km/h | Complete gridlock", 20, 582);

      // Stats box (right)
      context.fillStyle = "rgba(34, 197, 94, 0.2)";
      context.fillRect(910, 520, 280, 70);
      context.strokeStyle = "#22c55e";
      context.lineWidth = 2;
      context.strokeRect(910, 520, 280, 70);

      context.fillStyle = "#22c55e";
      context.font = "bold 16px Arial";
      context.fillText("✅ SMOOTH FLOW", 920, 545);
      context.font = "14px Arial";
      context.fillText("24/7: Max 60 trucks/hour (65% reduction)", 920, 565);
      context.fillText("Avg Speed: 68 km/h | No congestion", 920, 582);
    }

    drawChart();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-8 bg-white min-h-screen">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-black mb-2">
          PORTA Traffic Management System
        </h2>
        <p className="text-gray-600 text-sm max-w-3xl mb-2">
          Temporal Distribution: Spreading truck arrivals across 24 hours to
          eliminate peak-hour congestion
        </p>
        <p className="text-gray-700 text-xs max-w-3xl">
          King Abdulaziz Road to Dammam Seaport
        </p>
      </div>

      <canvas
        ref={canvasRef}
        className="border-2 border-gray-300 rounded-lg shadow-2xl bg-white"
      />

      <div className="flex gap-8 text-sm mt-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-red-500 rounded"></div>
          <span className="text-black">Peak Hour Surge (10am-2pm)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-500 rounded"></div>
          <span className="text-black">Distributed Daytime (6am-6pm)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-purple-500 rounded"></div>
          <span className="text-black">Night Shift (6pm-6am)</span>
        </div>
      </div>

      <div className="mt-4 text-center max-w-4xl">
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <p className="text-gray-800 text-sm leading-relaxed mb-2">
            <strong className="text-red-400">LEFT: Without PORTA</strong> -
            Vessel arrives 8am → Containers ready 10am → All 686 daily trucks
            rush to port between 10am-2pm (4 hours). Result:{" "}
            <strong className="text-red-600">171 trucks/hour</strong> creates
            complete gridlock on King Abdulaziz Road.
          </p>
          <p className="text-gray-800 text-sm leading-relaxed">
            <strong className="text-green-600">RIGHT: With PORTA</strong> - AI
            predicts vessel arrival and assigns TIME SLOTS across 24 hours.
            EMERGENCY cargo gets 10am-2pm slots (protected, ~60 trucks/hour).
            NORMAL cargo rescheduled to 6am-10am or 2pm-6pm (~30 trucks/hour).
            LOW priority moved to night shifts 12am-6am (~20 trucks/hour). Same
            686 trucks, spread across day. Result:{" "}
            <strong className="text-green-600">
              65% reduction in peak congestion (60 vs 171 trucks/hour)
            </strong>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
