"use client";
import { useEffect, useRef } from "react";

export default function TrafficComparisonTimeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 600;

    const context = ctx;

    // Car class
    class Car {
      x: number;
      y: number;
      color: string;
      width: number;
      height: number;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.width = 40;
        this.height = 20;
      }

      draw() {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
        context.strokeStyle = "#fff";
        context.lineWidth = 1;
        context.strokeRect(this.x, this.y, this.width, this.height);
      }
    }

    function drawRoad(
      startX: number,
      startY: number,
      width: number,
      height: number,
      label: string,
    ) {
      // Road background
      context.fillStyle = "#ffffff";
      context.fillRect(startX, startY, width, height);

      // 3 lanes (truck lane on right)
      for (let i = 1; i < 3; i++) {
        context.strokeStyle = "#999";
        context.lineWidth = 1;
        context.setLineDash([10, 10]);
        context.beginPath();
        const laneY = startY + (height / 3) * i;
        context.moveTo(startX, laneY);
        context.lineTo(startX + width, laneY);
        context.stroke();
        context.setLineDash([]);
      }

      // Time label
      context.fillStyle = "#000";
      context.font = "bold 14px Arial";
      context.textAlign = "left";
      context.fillText(label, startX + 5, startY - 5);

      // Arrow showing direction
      context.fillStyle = "#666";
      context.font = "bold 16px Arial";
      context.fillText("→ Port", startX + width - 60, startY - 5);
    }

    function drawScene() {
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
      context.fillText("WITHOUT PORTA", 300, 35);
      context.fillText("WITH PORTA", 900, 35);

      // LEFT SIDE: WITHOUT PORTA - Show 12pm (Peak Hour)
      context.fillStyle = "#ef4444";
      context.font = "16px Arial";
      context.fillText("King Abdulaziz Road - 12:00 PM", 300, 60);

      const leftRoadY = 80;
      const roadHeight = 80;
      const roadWidth = 500;

      drawRoad(50, leftRoadY, roadWidth, roadHeight, "12:00 PM (Peak)");

      // Pack the road with trucks (truck lane - bottom third)
      const truckLaneY = leftRoadY + (roadHeight / 3) * 2 + 5;
      const cars: Car[] = [];

      // Create gridlock - trucks bumper to bumper (171 trucks/hour means ~3 trucks/minute)
      for (let i = 0; i < 11; i++) {
        cars.push(new Car(50 + i * 45, truckLaneY, "#ef4444"));
      }

      // Add more trucks spilling into other lanes
      for (let i = 0; i < 10; i++) {
        cars.push(new Car(55 + i * 48, truckLaneY - 30, "#ef4444"));
      }

      cars.forEach((car) => car.draw());

      // Congestion warning
      context.fillStyle = "#ef4444";
      context.font = "bold 14px Arial";
      context.textAlign = "center";
      context.fillText(
        "🚨 171 trucks/hour - GRIDLOCK",
        300,
        leftRoadY + roadHeight + 25,
      );

      // RIGHT SIDE: WITH PORTA - Show multiple time snapshots
      context.fillStyle = "#22c55e";
      context.font = "16px Arial";
      context.fillText("King Abdulaziz Road - 24/7 Operation", 900, 60);

      const snapshots = [
        {
          time: "2:00 AM",
          y: 80,
          count: 2,
          color: "#8b5cf6",
          label: "Night Shift: 20 trucks/hour (LOW priority)",
        },
        {
          time: "6:00 AM",
          y: 180,
          count: 4,
          color: "#22c55e",
          label: "Morning: 30 trucks/hour (NORMAL)",
        },
        {
          time: "12:00 PM",
          y: 280,
          count: 7,
          color: "#f59e0b",
          label: "Peak: 60 trucks/hour (EMERGENCY protected)",
        },
        {
          time: "8:00 PM",
          y: 380,
          count: 3,
          color: "#8b5cf6",
          label: "Evening: 15 trucks/hour",
        },
      ];

      snapshots.forEach((snapshot) => {
        const roadStartX = 650;
        const miniRoadHeight = 60;

        drawRoad(
          roadStartX,
          snapshot.y,
          roadWidth,
          miniRoadHeight,
          snapshot.time,
        );

        // Draw trucks in truck lane (bottom third)
        const truckY = snapshot.y + (miniRoadHeight / 3) * 2 + 5;
        const spacing = roadWidth / (snapshot.count + 1);

        for (let i = 0; i < snapshot.count; i++) {
          const truckCar = new Car(
            roadStartX + (i + 1) * spacing - 20,
            truckY,
            snapshot.color,
          );
          truckCar.draw();
        }

        // Label
        context.fillStyle = snapshot.color;
        context.font = "12px Arial";
        context.textAlign = "center";
        context.fillText(snapshot.label, 900, snapshot.y + miniRoadHeight + 18);
      });

      // Stats box (left)
      context.fillStyle = "rgba(239, 68, 68, 0.2)";
      context.fillRect(10, 520, 280, 70);
      context.strokeStyle = "#ef4444";
      context.lineWidth = 2;
      context.strokeRect(10, 520, 280, 70);

      context.fillStyle = "#ef4444";
      context.font = "bold 16px Arial";
      context.textAlign = "left";
      context.fillText("🚨 ONE TIME SLOT", 20, 545);
      context.font = "14px Arial";
      context.fillText("10am-2pm: 686 trucks (all at once)", 20, 565);
      context.fillText("Peak: 171 trucks/hour | 12 km/h", 20, 582);

      // Stats box (right)
      context.fillStyle = "rgba(34, 197, 94, 0.2)";
      context.fillRect(910, 520, 280, 70);
      context.strokeStyle = "#22c55e";
      context.lineWidth = 2;
      context.strokeRect(910, 520, 280, 70);

      context.fillStyle = "#22c55e";
      context.font = "bold 16px Arial";
      context.fillText("✅ 24/7 TIME SLOTS", 920, 545);
      context.font = "14px Arial";
      context.fillText("Same 686 trucks, spread across day", 920, 565);
      context.fillText("Peak: 60 trucks/hour | 68 km/h", 920, 582);
    }

    drawScene();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-8 bg-white min-h-screen">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-black mb-2">
          PORTA Traffic Management System
        </h2>
        <p className="text-gray-600 text-sm max-w-3xl mb-2">
          Same road, different times: PORTA spreads truck arrivals across 24
          hours
        </p>
        <p className="text-gray-700 text-xs max-w-3xl">
          King Abdulaziz Road to Dammam Seaport (3-lane road, trucks use right
          lane)
        </p>
      </div>

      <canvas
        ref={canvasRef}
        className="border-2 border-gray-300 rounded-lg shadow-2xl bg-white"
      />

      <div className="flex gap-8 text-sm mt-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-red-500 rounded"></div>
          <span className="text-black">Peak Hour (12pm without PORTA)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-purple-500 rounded"></div>
          <span className="text-black">Night Shift (2am, 8pm)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-500 rounded"></div>
          <span className="text-black">Off-Peak (6am)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-orange-500 rounded"></div>
          <span className="text-black">Protected (12pm with PORTA)</span>
        </div>
      </div>

      <div className="mt-4 text-center max-w-4xl">
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <p className="text-gray-800 text-sm leading-relaxed mb-2">
            <strong className="text-red-400">LEFT: Without PORTA</strong> -
            Vessel arrives 8am → All 686 daily trucks rush to King Abdulaziz
            Road between 10am-2pm (after containers ready). Result:{" "}
            <strong className="text-red-600">171 trucks/hour</strong> = Complete
            gridlock at 12 km/h.
          </p>
          <p className="text-gray-800 text-sm leading-relaxed">
            <strong className="text-green-600">RIGHT: With PORTA</strong> - Same
            686 trucks, same road, but AI assigns different TIME SLOTS across 24
            hours. EMERGENCY gets 10am-2pm slots (60 trucks/hour protected).
            NORMAL moved to 6am-10am (30 trucks/hour). LOW priority to 12am-6am
            night shift (20 trucks/hour). No physical changes to road, just
            temporal distribution. Result:{" "}
            <strong className="text-green-400">
              Max 60 trucks/hour (65% reduction) flowing at 68 km/h
            </strong>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
