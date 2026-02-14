/**
 * Organization API Integration Management Page
 *
 * Allows organizations to configure and manage their vessel tracking API integration.
 * Features: API configuration, connection testing, sync status, sync history.
 */

import { getServerSupabaseClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APIIntegrationForm } from "@/components/api-integration-form";
import { Suspense } from "react";
import { CheckCircle2, XCircle, Clock, RefreshCw, AlertCircle } from "lucide-react";

export default async function APIIntegrationPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("org_session");

  if (!sessionCookie) {
    redirect("/org/auth/login");
  }

  const session = JSON.parse(sessionCookie.value);
  const organizationId = session.organization_id;
  const supabase = getServerSupabaseClient();

  // Fetch API integrations
  const { data: integrations } = await supabase
    .from("api_integrations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  // Fetch recent sync logs
  const { data: syncLogs } = await supabase
    .from("api_sync_logs")
    .select(`
      *,
      api_integrations!inner(organization_id)
    `)
    .eq("api_integrations.organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(10);

  const integration = integrations?.[0]; // Get primary integration

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">API Integration</h1>
        <p className="text-muted-foreground mt-2">
          Configure your vessel tracking API to automatically sync shipment data
        </p>
      </div>

      {/* Configuration Status */}
      {integration && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Integration Status</CardTitle>
                <CardDescription>Last sync and connection health</CardDescription>
              </div>
              <Badge
                variant={integration.is_active ? "default" : "secondary"}
                className="gap-2"
              >
                {integration.is_active ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    Inactive
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Last Sync */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="text-lg font-semibold">
                  {integration.last_sync_at
                    ? new Date(integration.last_sync_at).toLocaleString()
                    : "Never"}
                </p>
                <Badge
                  variant={
                    integration.last_sync_status === "SUCCESS"
                      ? "default"
                      : integration.last_sync_status === "FAILED"
                        ? "destructive"
                        : "secondary"
                  }
                  className="mt-1"
                >
                  {integration.last_sync_status || "PENDING"}
                </Badge>
              </div>

              {/* Sync Frequency */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Sync Frequency</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Every {integration.sync_frequency_minutes} minutes
                </p>
              </div>

              {/* Endpoint */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">API Endpoint</p>
                <p className="text-sm font-mono truncate" title={integration.api_endpoint}>
                  {integration.api_endpoint}
                </p>
              </div>
            </div>

            {/* Error Display */}
            {integration.last_sync_error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Last Sync Error</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {integration.last_sync_error}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <Suspense fallback={<div>Loading...</div>}>
        <APIIntegrationForm integration={integration} />
      </Suspense>

      {/* Sync History */}
      {syncLogs && syncLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
            <CardDescription>Recent API synchronization attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {syncLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {log.status === "SUCCESS" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : log.status === "FAILED" ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-yellow-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {log.sync_type} Sync
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {log.records_synced} records
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.duration_ms}ms
                      </p>
                    </div>
                    <Badge
                      variant={
                        log.status === "SUCCESS"
                          ? "default"
                          : log.status === "FAILED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {log.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-base">🎭 Demo Mode</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            For the hackathon demo, all API integrations use <strong>simulated data</strong>.
            You can configure your API settings here, and the system will generate mock vessel
            and shipment data based on your organization.
          </p>
          <p className="mt-2">
            In production, these settings would connect to your actual logistics API to fetch
            real vessel schedules and shipment data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
