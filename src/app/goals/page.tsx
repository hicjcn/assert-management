import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function GoalsPage() {
  return (
    <MobileShell title="目标">
      <Card>
        <CardContent className="pt-5 text-sm text-slate-600">
          这里将展示存钱目标、每月可存金额、目标进度和预计达成时间。
        </CardContent>
      </Card>
    </MobileShell>
  );
}
