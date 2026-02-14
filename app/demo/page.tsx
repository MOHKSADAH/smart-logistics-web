import TrafficComparisonChart from "@/components/traffic-comparison-chart";
import TrafficComparisonTimeline from "@/components/traffic-comparison-timeline";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-white">
      <TrafficComparisonChart />

      <div className="border-t-4 border-gray-200 mt-16"></div>

      <TrafficComparisonTimeline />
    </div>
  );
}
