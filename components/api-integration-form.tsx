"use client";

/**
 * API Integration Configuration Form
 *
 * Form for configuring organization API settings.
 * Includes connection testing and manual sync triggers.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TestTube, RefreshCw, Save, CheckCircle2, XCircle } from "lucide-react";

interface APIIntegration {
  id: string;
  api_type: string;
  api_endpoint: string;
  api_key: string | null;
  webhook_secret: string | null;
  is_active: boolean;
  sync_frequency_minutes: number;
}

interface APIIntegrationFormProps {
  integration?: APIIntegration | null;
}

export function APIIntegrationForm({ integration }: APIIntegrationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    vessels_found?: number;
    response_time_ms?: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    api_type: integration?.api_type || "VESSEL_TRACKING",
    api_endpoint: integration?.api_endpoint || "",
    api_key: integration?.api_key || "",
    webhook_secret: integration?.webhook_secret || "",
    is_active: integration?.is_active ?? true,
    sync_frequency_minutes: integration?.sync_frequency_minutes || 60,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/org/api-integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save configuration");
      }

      toast({
        title: "Success",
        description: data.message,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!integration?.id) {
      toast({
        title: "Error",
        description: "Please save the configuration first before testing",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/org/api-integration/${integration.id}/test`, {
        method: "POST",
      });

      const data = await response.json();

      setTestResult(data);

      toast({
        title: data.success ? "Connection Successful" : "Connection Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleManualSync = async () => {
    if (!integration?.id) {
      toast({
        title: "Error",
        description: "Please save the configuration first before syncing",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);

    try {
      const response = await fetch(`/api/org/api-integration/${integration.id}/sync`, {
        method: "POST",
      });

      const data = await response.json();

      toast({
        title: data.success ? "Sync Successful" : "Sync Failed",
        description: data.message,
      });

      if (data.success) {
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger sync",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Configuration</CardTitle>
        <CardDescription>
          Configure your organization's vessel tracking API integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* API Type */}
          <div className="space-y-2">
            <Label htmlFor="api_type">API Type</Label>
            <Select
              value={formData.api_type}
              onValueChange={(value) =>
                setFormData({ ...formData, api_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VESSEL_TRACKING">Vessel Tracking</SelectItem>
                <SelectItem value="SHIPMENT_DATA">Shipment Data</SelectItem>
                <SelectItem value="CONTAINER_STATUS">Container Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* API Endpoint */}
          <div className="space-y-2">
            <Label htmlFor="api_endpoint">API Endpoint URL</Label>
            <Input
              id="api_endpoint"
              type="url"
              placeholder="https://api.example.com/vessels"
              value={formData.api_endpoint}
              onChange={(e) =>
                setFormData({ ...formData, api_endpoint: e.target.value })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Your organization's API endpoint for vessel data
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="api_key">API Key (Optional)</Label>
            <Input
              id="api_key"
              type="password"
              placeholder="Enter your API key"
              value={formData.api_key}
              onChange={(e) =>
                setFormData({ ...formData, api_key: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Authentication key for your API (if required)
            </p>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <Label htmlFor="webhook_secret">Webhook Secret (Optional)</Label>
            <Input
              id="webhook_secret"
              type="password"
              placeholder="Enter webhook secret"
              value={formData.webhook_secret}
              onChange={(e) =>
                setFormData({ ...formData, webhook_secret: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Secret for validating webhook signatures
            </p>
          </div>

          {/* Sync Frequency */}
          <div className="space-y-2">
            <Label htmlFor="sync_frequency">Sync Frequency</Label>
            <Select
              value={formData.sync_frequency_minutes.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, sync_frequency_minutes: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">Every 15 minutes</SelectItem>
                <SelectItem value="30">Every 30 minutes</SelectItem>
                <SelectItem value="60">Every hour</SelectItem>
                <SelectItem value="360">Every 6 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_active">Enable Auto-Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync data on schedule
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-3 rounded-lg border ${
                testResult.success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      testResult.success ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {testResult.message}
                  </p>
                  {testResult.vessels_found !== undefined && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Found {testResult.vessels_found} vessels in{" "}
                      {testResult.response_time_ms}ms
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 me-2" />
                  Save Configuration
                </>
              )}
            </Button>

            {integration && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting || isLoading}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 me-2" />
                      Test Connection
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleManualSync}
                  disabled={isSyncing || isLoading}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 me-2" />
                      Sync Now
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
