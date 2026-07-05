import { Plus } from "lucide-react";

import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AccountsPage() {
  return (
    <MobileShell title="账户">
      <div className="space-y-4">
        <Button className="w-full">
          <Plus className="h-4 w-4" />
          新增资产账户
        </Button>
        <Card>
          <CardContent className="pt-5 text-sm text-slate-600">
            这里将展示账户列表、分类筛选和归档筛选。
          </CardContent>
        </Card>
      </div>
    </MobileShell>
  );
}
