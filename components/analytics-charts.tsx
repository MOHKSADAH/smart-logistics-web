"use client";

import { Bar, BarChart, Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTranslations } from 'next-intl';

const permitTrendsConfig = {
  EMERGENCY: {
    label: "Emergency",
    color: "#EF4444",
  },
  ESSENTIAL: {
    label: "Essential",
    color: "#F59E0B",
  },
  NORMAL: {
    label: "Normal",
    color: "#3B82F6",
  },
  LOW: {
    label: "Low",
    color: "#6B7280",
  },
} satisfies ChartConfig;

const trafficConfig = {
  avgVehicleCount: {
    label: "Avg Vehicles",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface AnalyticsChartsProps {
  permitsByDate: Record<string, Record<string, number>>;
  avgTrafficByHour: Array<{ hour: number; avgVehicleCount: number }>;
}

export function AnalyticsCharts({
  permitsByDate,
  avgTrafficByHour,
}: AnalyticsChartsProps) {
  const t = useTranslations('analytics');

  // Transform permits by date for chart
  const permitTrendsData = Object.entries(permitsByDate)
    .map(([date, counts]) => ({
      date: date.slice(5), // MM-DD format
      ...counts,
    }))
    .slice(-14); // Last 14 days

  // Sort traffic by hour
  const trafficData = avgTrafficByHour.sort((a, b) => a.hour - b.hour);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Daily Permit Trends */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dailyPermitTrends')}</CardTitle>
          <CardDescription>{t('permitsCreatedPerDay')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={permitTrendsConfig}>
            <BarChart data={permitTrendsData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar
                dataKey="EMERGENCY"
                stackId="a"
                fill="var(--color-EMERGENCY)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="ESSENTIAL"
                stackId="a"
                fill="var(--color-ESSENTIAL)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="NORMAL"
                stackId="a"
                fill="var(--color-NORMAL)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="LOW"
                stackId="a"
                fill="var(--color-LOW)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Congestion Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>{t('congestionPatterns')}</CardTitle>
          <CardDescription>{t('avgVehiclesByHour')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trafficConfig}>
            <AreaChart data={trafficData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value}:00`}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                content={<ChartTooltipContent hideLabel />}
              />
              <Area
                dataKey="avgVehicleCount"
                type="natural"
                fill="var(--color-avgVehicleCount)"
                fillOpacity={0.4}
                stroke="var(--color-avgVehicleCount)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Before/After PORTA Comparison Chart
const comparisonConfig = {
  withoutPorta: {
    label: "Without PORTA",
    color: "#EF4444",
  },
  withPorta: {
    label: "With PORTA",
    color: "#22C55E",
  },
} satisfies ChartConfig;

export function BeforeAfterComparisonChart() {
  const t = useTranslations('analytics');

  // Generate 24-hour comparison data
  const comparisonData = Array.from({ length: 24 }, (_, hour) => {
    let withoutPorta = 2;
    let withPorta = 15;

    // WITHOUT PORTA: Peak 10am-2pm
    if (hour >= 10 && hour <= 13) {
      withoutPorta = 171;
    } else if (hour >= 8 && hour <= 15) {
      withoutPorta = 15;
    }

    // WITH PORTA: Distributed across 24 hours
    if (hour >= 0 && hour <= 5) {
      withPorta = 20; // Night shift
    } else if (hour >= 6 && hour <= 9) {
      withPorta = 30; // Morning
    } else if (hour >= 10 && hour <= 13) {
      withPorta = 60; // Protected peak
    } else if (hour >= 14 && hour <= 17) {
      withPorta = 30; // Afternoon
    } else if (hour >= 18 && hour <= 23) {
      withPorta = 15; // Evening
    }

    return {
      hour: `${hour}:00`,
      hourNum: hour,
      withoutPorta,
      withPorta,
    };
  });

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('beforeAfterTitle')}</span>
          <span className="text-sm font-normal text-green-500">
            65% {t('peakReduction')}
          </span>
        </CardTitle>
        <CardDescription>
          {t('chartDescription', { without: 171, with: 60 })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={comparisonConfig} className="h-[350px]">
          <BarChart data={comparisonData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              label={{ value: t('trucksPerHour'), angle: -90, position: 'insideLeft' }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="withoutPorta"
              fill="var(--color-withoutPorta)"
              radius={[4, 4, 0, 0]}
              name={t('withoutPorta')}
            />
            <Bar
              dataKey="withPorta"
              fill="var(--color-withPorta)"
              radius={[4, 4, 0, 0]}
              name={t('withPorta')}
            />
          </BarChart>
        </ChartContainer>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">171</div>
            <div className="text-xs text-muted-foreground">{t('peakWithout')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">60</div>
            <div className="text-xs text-muted-foreground">{t('peakWith')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">65%</div>
            <div className="text-xs text-muted-foreground">{t('congestionReduction')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
