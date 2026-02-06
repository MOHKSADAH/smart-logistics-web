"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
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
import { TrafficUpdate } from "@/lib/types";

const chartConfig = {
  vehicle_count: {
    label: "Vehicles",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface TrafficChartProps {
  data: TrafficUpdate[];
}

export function TrafficChart({ data }: TrafficChartProps) {
  const chartData = data.map((item) => ({
    time: format(new Date(item.timestamp), "HH:mm"),
    vehicle_count: item.vehicle_count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>24-Hour Traffic History</CardTitle>
        <CardDescription>Vehicle count over the last 24 hours</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value, index) => {
                // Show every 4th label to avoid crowding
                return index % 4 === 0 ? value : "";
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Area
              dataKey="vehicle_count"
              type="natural"
              fill="var(--color-vehicle_count)"
              fillOpacity={0.4}
              stroke="var(--color-vehicle_count)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
