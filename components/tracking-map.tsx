"use client";

import { useEffect, useState } from "react";
import { MapPin, Navigation, Package } from "lucide-react";

interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface CurrentLocation {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

interface TrackingMapProps {
  jobId: string;
  driverId: string | null;
  currentLocation: CurrentLocation | null;
  pickupLocation: Location;
  deliveryLocation: Location;
}

export function TrackingMap({
  jobId,
  driverId,
  currentLocation,
  pickupLocation,
  deliveryLocation,
}: TrackingMapProps) {
  const [driverPos, setDriverPos] = useState(currentLocation);

  // Auto-refresh driver location every 30 seconds
  useEffect(() => {
    if (!driverId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/org/jobs/${jobId}/track`);
        const data = await response.json();
        if (data.success && data.location) {
          setDriverPos(data.location);
        }
      } catch (error) {
        console.error("Failed to fetch driver location:", error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [jobId, driverId]);

  // Calculate ETA (simple distance-based estimate)
  const calculateETA = () => {
    if (!driverPos) return "N/A";

    // Haversine distance calculation
    const R = 6371; // Earth radius in km
    const dLat = (deliveryLocation.lat - driverPos.latitude) * Math.PI / 180;
    const dLng = (deliveryLocation.lng - driverPos.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(driverPos.latitude * Math.PI / 180) *
      Math.cos(deliveryLocation.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Assuming average speed of 60 km/h in city
    const avgSpeed = driverPos.speed && driverPos.speed > 0 ? driverPos.speed : 60;
    const etaHours = distance / avgSpeed;
    const etaMinutes = Math.round(etaHours * 60);

    if (etaMinutes < 60) {
      return `${etaMinutes} min`;
    } else {
      const hours = Math.floor(etaMinutes / 60);
      const mins = etaMinutes % 60;
      return `${hours}h ${mins}m`;
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Demo Map Visualization */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full max-w-4xl max-h-full p-8">
          {/* Road/Route Visualization */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            {/* Dashed route line from pickup to delivery */}
            <line
              x1="20%"
              y1="50%"
              x2="80%"
              y2="50%"
              stroke="#94a3b8"
              strokeWidth="3"
              strokeDasharray="10,5"
            />
          </svg>

          {/* Pickup Location Marker */}
          <div
            className="absolute"
            style={{ left: "15%", top: "45%", zIndex: 10 }}
          >
            <div className="relative">
              <div className="bg-blue-500 text-white p-3 rounded-full shadow-lg animate-pulse">
                <Package className="h-6 w-6" />
              </div>
              <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-lg shadow-md border border-blue-200 whitespace-nowrap">
                <p className="text-xs font-semibold text-blue-700">Pickup</p>
                <p className="text-xs text-gray-600">{pickupLocation.name}</p>
              </div>
            </div>
          </div>

          {/* Driver Current Location (if available) */}
          {driverPos && (
            <div
              className="absolute"
              style={{ left: "50%", top: "45%", zIndex: 20 }}
            >
              <div className="relative">
                <div className="bg-green-500 text-white p-3 rounded-full shadow-xl animate-bounce">
                  <Navigation className="h-6 w-6" />
                </div>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap font-semibold text-sm">
                  Driver Location
                </div>
                <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white px-3 py-2 rounded-lg shadow-md border border-green-200 min-w-[120px]">
                  <p className="text-xs text-gray-500">ETA</p>
                  <p className="text-sm font-bold text-green-700">{calculateETA()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Location Marker */}
          <div
            className="absolute"
            style={{ left: "85%", top: "45%", zIndex: 10 }}
          >
            <div className="relative">
              <div className="bg-red-500 text-white p-3 rounded-full shadow-lg animate-pulse">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-lg shadow-md border border-red-200 whitespace-nowrap">
                <p className="text-xs font-semibold text-red-700">Delivery</p>
                <p className="text-xs text-gray-600">{deliveryLocation.name}</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border z-30">
            <p className="text-xs font-semibold text-gray-700 mb-2">Map Legend</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500 w-3 h-3 rounded-full"></div>
                <p className="text-xs text-gray-600">Pickup Point</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-green-500 w-3 h-3 rounded-full"></div>
                <p className="text-xs text-gray-600">Driver (Live)</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-red-500 w-3 h-3 rounded-full"></div>
                <p className="text-xs text-gray-600">Delivery Point</p>
              </div>
            </div>
          </div>

          {/* No driver assigned message */}
          {!driverId && (
            <div className="absolute top-4 right-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg z-30">
              <p className="text-sm font-medium">No driver assigned yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-4 right-4 text-xs text-gray-400 z-30">
        🗺️ Demo Map Visualization
      </div>
    </div>
  );
}
