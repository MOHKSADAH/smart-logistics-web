/**
 * Admin Organizations Overview Page
 *
 * Shows all organizations with activity metrics.
 * Allows admin to monitor organization behavior and drill down into details.
 */

import { getAllOrganizationsActivity } from "@/lib/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { getTranslations } from 'next-intl/server';

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const t = await getTranslations('organizations');
  const organizations = await getAllOrganizationsActivity();

  // Calculate overall stats
  const totalOrganizations = organizations.length;
  const totalJobs = organizations.reduce((sum, org) => sum + org.totalJobs, 0);
  const totalPermits = organizations.reduce((sum, org) => sum + org.totalPermits, 0);
  const avgCompletionRate =
    totalOrganizations > 0
      ? Math.round(
          organizations.reduce((sum, org) => sum + org.completionRate, 0) / totalOrganizations
        )
      : 0;

  // Identify organizations with potential priority abuse
  const suspiciousOrgs = organizations.filter(
    (org) =>
      org.totalJobs > 0 &&
      (org.priorityBreakdown.EMERGENCY / org.totalJobs) * 100 > 30
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('description')}
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('totalOrganizations')}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalOrganizations}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('totalJobs')}
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalJobs}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('totalPermits')}
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPermits}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('avgCompletionRate')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgCompletionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Abuse Warnings */}
      {suspiciousOrgs.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">{t('priorityAbuseAlert')}</CardTitle>
            </div>
            <CardDescription>
              {t('priorityAbuseDescription', { count: suspiciousOrgs.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suspiciousOrgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {org.priorityBreakdown.EMERGENCY} {t('emergencyJobs')} {org.totalJobs} {t('total')}
                      ({Math.round((org.priorityBreakdown.EMERGENCY / org.totalJobs) * 100)}%)
                    </p>
                  </div>
                  <Badge variant="destructive" className="shrink-0">
                    {Math.round((org.priorityBreakdown.EMERGENCY / org.totalJobs) * 100)}% EMERGENCY
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('allOrganizations')}</CardTitle>
          <CardDescription>{t('orgActivityOverview')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organizations.map((org) => (
              <Card key={org.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      {/* Organization Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{org.name}</h3>
                            <p className="text-sm text-muted-foreground">{org.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-4 gap-6">
                        {/* Jobs */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">{t('jobs')}</p>
                          <p className="text-lg font-bold text-foreground">{org.totalJobs}</p>
                          <p className="text-xs text-green-600">{org.completedJobs} {t('completed')}</p>
                        </div>

                        {/* Permits */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">{t('permits')}</p>
                          <p className="text-lg font-bold text-foreground">{org.totalPermits}</p>
                          <div className="flex gap-2 justify-center mt-1">
                            <Badge variant="default" className="text-xs">
                              {org.approvedPermits} {t('approved')}
                            </Badge>
                            {org.haltedPermits > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {org.haltedPermits} {t('halted')}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Completion Rate */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">{t('completionRate')}</p>
                          <p className="text-lg font-bold text-foreground">
                            {org.completionRate}%
                          </p>
                          <Badge
                            variant={org.completionRate >= 80 ? "default" : "secondary"}
                            className="text-xs mt-1"
                          >
                            {org.completionRate >= 80 ? t('good') : t('fair')}
                          </Badge>
                        </div>

                        {/* Last Activity */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">{t('lastActivity')}</p>
                          <p className="text-sm font-medium text-foreground flex items-center gap-1 justify-center">
                            <Clock className="h-3 w-3" />
                            {org.lastActivity
                              ? new Date(org.lastActivity).toLocaleDateString()
                              : t('never')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Priority Breakdown */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">{t('priorityDistribution')}</p>
                      <div className="flex gap-2">
                        {org.priorityBreakdown.EMERGENCY > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            EMERGENCY: {org.priorityBreakdown.EMERGENCY}
                          </Badge>
                        )}
                        {org.priorityBreakdown.ESSENTIAL > 0 && (
                          <Badge variant="default" className="text-xs bg-orange-500">
                            ESSENTIAL: {org.priorityBreakdown.ESSENTIAL}
                          </Badge>
                        )}
                        {org.priorityBreakdown.NORMAL > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            NORMAL: {org.priorityBreakdown.NORMAL}
                          </Badge>
                        )}
                        {org.priorityBreakdown.LOW > 0 && (
                          <Badge variant="outline" className="text-xs">
                            LOW: {org.priorityBreakdown.LOW}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
            ))}
          </div>

          {organizations.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('noOrganizations')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
