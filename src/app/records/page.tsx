import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function RecordsPage() {
  return (
    <MobileShell title="变更记录">
      <Card>
        <CardContent className="pt-5 text-sm text-slate-600">
          这里将展示所有账户的金额变更记录，并支持账户、分类、类型和时间筛选。
        </CardContent>
      </Card>
    </MobileShell>
  );
}
