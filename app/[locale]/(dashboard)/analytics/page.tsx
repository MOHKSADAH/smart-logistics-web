import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { getAnalyticsData } from "@/lib/queries";
import { getTranslations } from 'next-intl/server';

export default async function AnalyticsPage() {
  const t = await getTranslations('analytics');
  const analytics = await getAnalyticsData();

  const totalPermits = Object.values(analytics.permitsByPriority).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      {/* Charts */}
      <AnalyticsCharts
        permitsByDate={analytics.permitsByDate}
        avgTrafficByHour={analytics.avgTrafficByHour}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Permit Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.permitsByStatus).map(
                ([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{status}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(count / totalPermits) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.permitsByPriority).map(
                ([priority, count]) => {
                  const percentage = ((count / totalPermits) * 100).toFixed(1);
                  const colors: Record<string, string> = {
                    EMERGENCY: "bg-red-600",
                    ESSENTIAL: "bg-amber-600",
                    NORMAL: "bg-blue-600",
                    LOW: "bg-gray-600",
                  };

                  return (
                    <div
                      key={priority}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm font-medium">{priority}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`${colors[priority]} h-2 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-12 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
