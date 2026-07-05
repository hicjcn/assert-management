import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/server/auth";

export default async function GoalsPage() {
  await requireSession();

  return (
    <MobileShell title="目标">
      <Card>
        <CardContent className="pt-5 text-sm text-[#3a3a3c]">
          这里将展示存钱目标、每月可存金额、目标进度和预计达成时间。
        </CardContent>
      </Card>
    </MobileShell>
  );
}
