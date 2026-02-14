"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle, AlertCircle, Clock, Volume2, VolumeX, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TruckPlateBadge } from "@/components/truck-plate-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  type: string;
  message: string;
  status: "PENDING" | "DELIVERED" | "FAILED";
  created_at: string;
  driver?: {
    name: string;
    phone: string;
    vehicle_plate: string;
  } | null;
}

interface NotificationFeedProps {
  notifications: Notification[];
  enableSound?: boolean;
}

const notificationTypeConfig = {
  PERMIT_APPROVED: {
    color: "bg-green-50 border-green-200 text-green-900",
    icon: CheckCircle,
    iconColor: "text-green-600",
  },
  PERMIT_HALTED: {
    color: "bg-red-50 border-red-200 text-red-900",
    icon: AlertCircle,
    iconColor: "text-red-600",
  },
  JOB_ASSIGNED: {
    color: "bg-blue-50 border-blue-200 text-blue-900",
    icon: Bell,
    iconColor: "text-blue-600",
  },
  JOB_COMPLETED: {
    color: "bg-green-50 border-green-200 text-green-900",
    icon: CheckCircle,
    iconColor: "text-green-600",
  },
  SLOT_RESCHEDULED: {
    color: "bg-yellow-50 border-yellow-200 text-yellow-900",
    icon: Clock,
    iconColor: "text-yellow-600",
  },
  DEFAULT: {
    color: "bg-gray-50 border-gray-200 text-gray-900",
    icon: Bell,
    iconColor: "text-gray-600",
  },
};

export function NotificationFeed({ notifications, enableSound = false }: NotificationFeedProps) {
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(20);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevCountRef = useRef(notifications.length);

  // Get unique notification types for filter
  const notificationTypes = Array.from(
    new Set(notifications.map((n) => n.type))
  );

  // Filter notifications
  const filteredNotifications = selectedTypes.size === 0
    ? notifications
    : notifications.filter((n) => selectedTypes.has(n.type));

  const displayedNotifications = filteredNotifications.slice(0, displayCount);

  // Play sound when new notification arrives
  useEffect(() => {
    if (soundEnabled && notifications.length > prevCountRef.current) {
      // New notification arrived
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // Silently fail if sound can't play
        });
      }
    }
    prevCountRef.current = notifications.length;
  }, [notifications.length, soundEnabled]);

  const toggleType = (type: string) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);
  };

  const getNotificationConfig = (type: string) => {
    return notificationTypeConfig[type as keyof typeof notificationTypeConfig] || notificationTypeConfig.DEFAULT;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Live Notification Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            {notificationTypes.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                    {selectedTypes.size > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedTypes.size}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {notificationTypes.map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={selectedTypes.has(type)}
                      onCheckedChange={() => toggleType(type)}
                    >
                      {type.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Sound Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          <AnimatePresence initial={false}>
            {displayedNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-muted-foreground py-12"
              >
                <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="font-medium">No notifications</p>
                <p className="text-sm mt-1">Notifications will appear here in real-time</p>
              </motion.div>
            ) : (
              displayedNotifications.map((notification, index) => {
                const config = getNotificationConfig(notification.type);
                const Icon = config.icon;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: "easeOut",
                    }}
                  >
                    <div
                      className={`
                        p-4 rounded-lg border-l-4 transition-all
                        ${config.color}
                        hover:shadow-md
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${config.iconColor}`} />
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {notification.type.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>

                          <p className="text-sm font-medium">{notification.message}</p>

                          {notification.driver && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Driver:</span>
                              <span className="font-medium">{notification.driver.name}</span>
                              {notification.driver.vehicle_plate && (
                                <TruckPlateBadge plate={notification.driver.vehicle_plate} />
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                notification.status === "DELIVERED"
                                  ? "default"
                                  : notification.status === "FAILED"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {notification.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>

          {/* Load More Button */}
          {filteredNotifications.length > displayCount && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setDisplayCount(displayCount + 20)}
            >
              Load More ({filteredNotifications.length - displayCount} remaining)
            </Button>
          )}
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          preload="auto"
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSqFzvLaizsIGGS47OihUQ0MTqXi8LJnHwc5j9n"
        />
      </CardContent>
    </Card>
  );
}
