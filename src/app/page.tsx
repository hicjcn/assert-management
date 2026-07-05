import { ArrowDownRight, ArrowUpRight, Landmark, Plus } from "lucide-react";
import Link from "next/link";

import { logoutAction } from "@/app/actions";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAccountChangeCents, formatCents } from "@/lib/money";
import { changeTypeLabels } from "@/types/domain";
import { getDashboard } from "@/server/assets";
import { requireSession } from "@/server/auth";

export default async function Home() {
  const session = await requireSession();
  const summary = await getDashboard(session.userId);

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
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-600 px-4 text-sm font-medium text-white transition hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
            href="/accounts"
          >
            <Plus className="h-4 w-4" />
            新增账户
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
            href="/records"
          >
            <Landmark className="h-4 w-4" />
            记录变更
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>最近变更</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {summary.recentChanges.length === 0 ? (
              <p className="text-slate-500">记录金额变化后，这里会显示流水。</p>
            ) : (
              summary.recentChanges.map((change) => (
                <div
                  className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                  key={change.id}
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {change.accountName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {changeTypeLabels[change.type]} ·{" "}
                      {change.changedAt.toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">
                    {formatAccountChangeCents(change, {
                      category: change.category,
                    })}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <form action={logoutAction}>
          <Button className="w-full" type="submit" variant="ghost">
            退出登录
          </Button>
        </form>
      </section>
    </MobileShell>
  );
}
