import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/server/auth";

export default async function ChartsPage() {
  await requireSession();

  return (
    <MobileShell title="图表">
      <Card>
        <CardContent className="pt-5 text-sm text-[#3a3a3c]">
          这里将接入 ECharts，展示资产、负债和净资产的趋势、占比与排行榜。
        </CardContent>
      </Card>
    </MobileShell>
  );
}
