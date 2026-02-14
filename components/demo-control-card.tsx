'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LucideIcon } from "lucide-react";
import { toast } from "sonner";

interface DemoControlCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action: () => Promise<{ success: boolean; message: string; data?: any }>;
  actionLabel: string;
  variant?: "default" | "destructive" | "outline" | "secondary";
}

export function DemoControlCard({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  variant = "default",
}: DemoControlCardProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      const result = await action();
      if (result.success) {
        toast.success(result.message, {
          description: result.data ? JSON.stringify(result.data, null, 2).substring(0, 100) : undefined,
        });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Action failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleAction}
          disabled={loading}
          variant={variant}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            actionLabel
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
