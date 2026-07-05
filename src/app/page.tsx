import { ArrowDownRight, ArrowUpRight, Landmark, Plus } from "lucide-react";

import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/money";

const summary = {
  assets: 128_560_00,
  liabilities: 18_200_00,
  netWorth: 110_360_00,
  monthlyChange: 5_800_00,
};

export default function Home() {
  return (
    <MobileShell title="资产管家">
      <section className="space-y-4">
        <Card className="border-emerald-100 bg-emerald-50">
          <CardHeader>
            <CardTitle>净资产</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold tracking-normal">
              {formatCents(summary.netWorth)}
            </p>
            <p className="mt-2 flex items-center gap-1 text-sm text-emerald-700">
              <ArrowUpRight className="h-4 w-4" />
              本月变化 {formatCents(summary.monthlyChange, { signed: true })}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="space-y-2 pt-4">
              <ArrowUpRight className="h-5 w-5 text-teal-600" />
              <p className="text-sm text-slate-500">总资产</p>
              <p className="text-lg font-semibold">
                {formatCents(summary.assets)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 pt-4">
              <ArrowDownRight className="h-5 w-5 text-rose-500" />
              <p className="text-sm text-slate-500">总负债</p>
              <p className="text-lg font-semibold">
                {formatCents(summary.liabilities)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button>
            <Plus className="h-4 w-4" />
            新增账户
          </Button>
          <Button variant="secondary">
            <Landmark className="h-4 w-4" />
            记录变更
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>第一版开发骨架</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>当前页面用于验证移动端布局、色彩和基础组件。</p>
            <p>后续接入登录、Prisma、MySQL 和真实统计数据。</p>
          </CardContent>
        </Card>
      </section>
    </MobileShell>
  );
}
