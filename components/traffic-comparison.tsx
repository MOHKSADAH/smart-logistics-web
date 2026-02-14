'use client';
import { useEffect, useRef } from 'react';

export default function TrafficComparison() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 600;

    // TypeScript guard - ctx is guaranteed non-null from here
    const context = ctx;

    // Car class
    class Car {
      x: number;
      y: number;
      speed: number;
      color: string;
      lane: number;
      width: number;
      height: number;
      side: 'left' | 'right';
      halted: boolean;

      constructor(x: number, y: number, speed: number, color: string, lane: number, side: 'left' | 'right', halted: boolean = false) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.color = color;
        this.lane = lane;
        this.width = 40;
        this.height = 20;
        this.side = side;
        this.halted = halted;
      }

      draw() {
        // Draw car body
        context.fillStyle = this.halted ? '#888' : this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
        context.strokeStyle = '#fff';
        context.lineWidth = 1;
        context.strokeRect(this.x, this.y, this.width, this.height);

        // Draw "H" on halted vehicles
        if (this.halted) {
          context.fillStyle = '#fff';
          context.font = 'bold 12px Arial';
          context.textAlign = 'center';
          context.fillText('H', this.x + 20, this.y + 14);
        }
      }

      // Check if this car collides with another car
      collidesWith(other: Car): boolean {
        return Math.abs(this.y - other.y) < 25 && // Same lane (25px tolerance)
               Math.abs(this.x - other.x) < 50;   // Less than 50px apart
      }

      update(allCars: Car[]) {
        if (!this.halted) {
          // Check for cars ahead in the same lane
          let canMove = true;
          for (const other of allCars) {
            if (other !== this && this.collidesWith(other)) {
              if (other.x > this.x && other.x - this.x < 50) {
                canMove = false;
                break;
              }
            }
          }

          if (canMove) {
            this.x += this.speed;
          } else {
            // Move slowly if blocked
            this.x += this.speed * 0.3;
          }
        }

        // Reset based on side
        if (this.side === 'left') {
          if (this.x > 580) this.x = -50;
        } else {
          if (this.x > 1200) this.x = 600;
        }
      }
    }

    // WITHOUT PORTA (Left side) - Peak Hour Chaos (10am-2pm surge)
    const chaoticCars: Car[] = [];
    // Spawn cars with better spacing to avoid immediate collision
    for (let i = 0; i < 20; i++) {
      const lane = Math.floor(Math.random() * 4);
      chaoticCars.push(new Car(
        (i * 30) % 550, // Better horizontal spacing
        120 + (lane * 70) + Math.random() * 20, // Lane-based positioning
        0.3 + Math.random() * 0.5, // Slow, varying speeds
        '#ef4444', // All red (congested)
        lane,
        'left'
      ));
    }

    // WITH PORTA (Right side) - 24/7 Distributed + Priority Lanes
    const organizedCars: Car[] = [];

    // Lane assignments by priority
    const lanes = {
      emergency: 130,    // Top priority lane
      essential: 200,    // Second priority lane
      normal: 270,       // Third lane (some halted)
      low: 340,          // Bottom lane (most halted)
      night: 410         // Night shift lane
    };

    // EMERGENCY trucks (always moving, top lane)
    for (let i = 0; i < 3; i++) {
      organizedCars.push(new Car(
        640 + (i * 150), // Better spacing
        lanes.emergency,
        2.5, // Consistent fast speed
        '#ef4444', // Red
        0,
        'right',
        false
      ));
    }

    // ESSENTIAL trucks (always moving, second lane)
    for (let i = 0; i < 3; i++) {
      organizedCars.push(new Car(
        700 + (i * 160), // Better spacing
        lanes.essential,
        2.0, // Consistent speed
        '#f59e0b', // Orange
        1,
        'right',
        false
      ));
    }

    // NORMAL trucks (some moving, some halted)
    for (let i = 0; i < 4; i++) {
      const isHalted = i % 2 === 0; // 50% halted
      organizedCars.push(new Car(
        620 + (i * 140), // Better spacing
        lanes.normal,
        isHalted ? 0 : 1.5,
        '#3b82f6', // Blue
        2,
        'right',
        isHalted
      ));
    }

    // LOW priority trucks (mostly halted, rescheduled to night)
    for (let i = 0; i < 3; i++) {
      organizedCars.push(new Car(
        660 + (i * 160), // Better spacing
        lanes.low,
        0,
        '#6b7280', // Gray
        3,
        'right',
        true // All halted during peak
      ));
    }

    // Night shift trucks (moving smoothly, bottom lane)
    for (let i = 0; i < 2; i++) {
      organizedCars.push(new Car(
        720 + (i * 200), // Better spacing
        lanes.night,
        2.0,
        '#8b5cf6', // Purple (night shift)
        4,
        'right',
        false
      ));
    }

    // Animation loop
    function animate() {
      // Clear canvas
      context.fillStyle = '#0a0a0a';
      context.fillRect(0, 0, 1200, 600);

      // Dividing line
      context.strokeStyle = '#fff';
      context.lineWidth = 2;
      context.setLineDash([10, 5]);
      context.beginPath();
      context.moveTo(600, 0);
      context.lineTo(600, 600);
      context.stroke();
      context.setLineDash([]);

      // Headers
      context.fillStyle = '#fff';
      context.font = 'bold 26px Arial';
      context.textAlign = 'center';
      context.fillText('WITHOUT PORTA', 300, 45);
      context.fillText('WITH PORTA', 900, 45);

      // Subheaders
      context.font = '14px Arial';
      context.fillStyle = '#ef4444';
      context.fillText('Peak Hours (10am-2pm)', 300, 70);
      context.fillStyle = '#22c55e';
      context.fillText('24/7 Load Distribution', 900, 70);

      // Add "Port Access Road" labels
      context.font = '12px Arial';
      context.fillStyle = '#666';
      context.fillText('Port Access Road →', 300, 95);
      context.fillText('Priority Lane System →', 900, 95);

      // Road lanes (left side) - chaotic
      context.strokeStyle = '#222';
      context.lineWidth = 1;
      for (let i = 120; i < 500; i += 80) {
        context.setLineDash([5, 5]);
        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(600, i);
        context.stroke();
        context.setLineDash([]);
      }

      // Direction arrows (left side)
      context.fillStyle = '#333';
      context.font = 'bold 20px Arial';
      for (let x = 100; x < 600; x += 150) {
        context.fillText('→', x, 110);
      }

      // Priority lanes (right side) - organized
      context.strokeStyle = '#333';
      const laneLabels = [
        { y: lanes.emergency, label: 'EMERGENCY', color: '#ef4444' },
        { y: lanes.essential, label: 'ESSENTIAL', color: '#f59e0b' },
        { y: lanes.normal, label: 'NORMAL', color: '#3b82f6' },
        { y: lanes.low, label: 'LOW (Halted)', color: '#6b7280' },
        { y: lanes.night, label: 'Night Shift', color: '#8b5cf6' },
      ];

      laneLabels.forEach(({ y, label, color }) => {
        context.beginPath();
        context.moveTo(600, y + 25);
        context.lineTo(1200, y + 25);
        context.stroke();

        // Lane labels
        context.fillStyle = color;
        context.font = 'bold 10px Arial';
        context.textAlign = 'left';
        context.fillText(label, 610, y + 15);
      });

      // Direction arrows (right side)
      context.fillStyle = '#333';
      context.font = 'bold 20px Arial';
      for (let x = 700; x < 1200; x += 150) {
        context.fillText('→', x, 110);
      }

      // Stats box (left)
      context.fillStyle = 'rgba(239, 68, 68, 0.2)';
      context.fillRect(10, 520, 280, 70);
      context.strokeStyle = '#ef4444';
      context.lineWidth = 2;
      context.strokeRect(10, 520, 280, 70);

      context.fillStyle = '#ef4444';
      context.font = 'bold 16px Arial';
      context.textAlign = 'left';
      context.fillText('🚨 CONGESTED', 20, 545);
      context.font = '14px Arial';
      context.fillText('Vehicles: 156 (All trying at once)', 20, 565);
      context.fillText('Avg Speed: 12 km/h', 20, 582);

      // Stats box (right)
      context.fillStyle = 'rgba(34, 197, 94, 0.2)';
      context.fillRect(910, 520, 280, 70);
      context.strokeStyle = '#22c55e';
      context.lineWidth = 2;
      context.strokeRect(910, 520, 280, 70);

      context.fillStyle = '#22c55e';
      context.font = 'bold 16px Arial';
      context.fillText('✅ FLOWING', 920, 545);
      context.font = '14px Arial';
      context.fillText('Priority Protected: 6 trucks', 920, 565);
      context.fillText('Avg Speed: 68 km/h | -40% congestion', 920, 582);

      // Update and draw cars
      chaoticCars.forEach(car => {
        car.update(chaoticCars);
        car.draw();
      });

      organizedCars.forEach(car => {
        car.update(organizedCars);
        car.draw();
      });

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-8 bg-black min-h-screen">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-white mb-2">PORTA Traffic Management System</h2>
        <p className="text-gray-400 text-sm max-w-3xl mb-2">
          Top-down view of port access roads: Trucks moving left to right toward Dammam seaport
        </p>
        <p className="text-gray-500 text-xs max-w-3xl">
          Reducing port-related congestion by 40% through AI-powered priority lanes and vessel schedule prediction
        </p>
      </div>

      <canvas
        ref={canvasRef}
        className="border-2 border-gray-700 rounded-lg shadow-2xl"
      />

      <div className="flex gap-8 text-sm mt-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-red-500 rounded"></div>
          <span className="text-white">EMERGENCY (Medical, Perishable)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-orange-500 rounded"></div>
          <span className="text-white">ESSENTIAL (Time-Sensitive)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-500 rounded"></div>
          <span className="text-white">NORMAL (Standard Containers)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-500 rounded"></div>
          <span className="text-white">LOW (Bulk - Rescheduled)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-purple-500 rounded"></div>
          <span className="text-white">Night Shift (Off-Peak)</span>
        </div>
      </div>

      <div className="mt-4 text-center max-w-4xl">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-300 text-sm leading-relaxed mb-2">
            <strong className="text-red-400">LEFT: Without PORTA</strong> - All trucks arrive at once during peak hours (10am-2pm) after vessel unloading.
            Chaotic congestion with average speed of 12 km/h. All cargo types mixed together.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            <strong className="text-green-400">RIGHT: With PORTA</strong> - AI predicts vessel arrivals and assigns priority lanes.
            EMERGENCY (red) & ESSENTIAL (orange) cargo flows freely. NORMAL (blue) gets rescheduled. LOW (gray) moves to night shifts.
            Halted trucks marked with "H". Result: <strong className="text-green-400">40% less congestion, 100% on-time for urgent cargo</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
