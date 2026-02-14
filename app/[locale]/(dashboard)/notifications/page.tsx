import { Bell, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getTranslations } from 'next-intl/server';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { RealtimeListener } from "@/components/realtime-listener";
import { TruckPlateBadge } from "@/components/truck-plate-badge";
import { NotificationFeed } from "@/components/notification-feed";
import { getServerSupabaseClient } from "@/lib/supabase";

async function getNotifications() {
  const supabase = getServerSupabaseClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select(`
      *,
      driver:drivers(name, phone, vehicle_plate)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  return notifications || [];
}

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  const t = await getTranslations('notifications');
  const tCommon = await getTranslations('common');

  return (
    <div className="space-y-6">
      {/* Real-time updates */}
      <RealtimeListener table="notifications" />

      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('totalSent')}</span>
          </div>
          <p className="text-2xl font-bold mt-2">{notifications.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">{t('delivered')}</span>
          </div>
          <p className="text-2xl font-bold mt-2">
            {notifications.filter((n) => n.status === "DELIVERED").length}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-muted-foreground">{t('pending')}</span>
          </div>
          <p className="text-2xl font-bold mt-2">
            {notifications.filter((n) => n.status === "PENDING").length}
          </p>
        </div>
      </div>

      {/* Animated Notification Feed */}
      <NotificationFeed notifications={notifications} enableSound={true} />
    </div>
  );
}
