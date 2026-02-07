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

      {/* Notifications Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon('driver')}</TableHead>
              <TableHead>{t('type')}</TableHead>
              <TableHead>{t('message')}</TableHead>
              <TableHead>{tCommon('status')}</TableHead>
              <TableHead>{t('sent')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-12"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Bell className="h-12 w-12 text-muted-foreground/50" />
                    <div>
                      <p className="font-medium">{t('noNotifications')}</p>
                      <p className="text-sm mt-1">
                        {t('notificationsWillAppear')}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {notification.driver?.name || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {notification.driver?.vehicle_plate || ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{notification.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm truncate">{notification.message}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        notification.status === "DELIVERED"
                          ? "default"
                          : notification.status === "FAILED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {notification.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
