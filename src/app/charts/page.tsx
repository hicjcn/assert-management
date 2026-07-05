import { ChartsDashboard } from "@/components/charts/charts-dashboard";
import { MobileShell } from "@/components/layout/mobile-shell";
import { getCharts } from "@/server/assets";
import { requireSession } from "@/server/auth";

export default async function ChartsPage() {
  const session = await requireSession();
  const charts = await getCharts(session.userId);

  return (
    <MobileShell title="图表">
      <ChartsDashboard data={charts} />
    </MobileShell>
  );
}
