import { Plus } from "lucide-react";

import { createAccountAction } from "@/app/actions";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCents } from "@/lib/money";
import { listAccounts } from "@/server/assets";
import { requireSession } from "@/server/auth";
import {
  accountCategoryLabels,
  accountCategoryValues,
  accountTypeLabels,
} from "@/types/domain";

export default async function AccountsPage() {
  const session = await requireSession();
  const accounts = await listAccounts(session.userId);

  return (
    <MobileShell title="账户">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>新增账户</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAccountAction} className="space-y-3">
              <Input name="name" placeholder="账户名称" required />
              <select
                className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                name="category"
                required
              >
                {accountCategoryValues.map((category) => (
                  <option key={category} value={category}>
                    {accountCategoryLabels[category]}
                  </option>
                ))}
              </select>
              <Input
                inputMode="decimal"
                name="currentAmount"
                placeholder="当前余额，如 1200.00"
                required
              />
              <Input name="note" placeholder="备注，可选" />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  className="h-4 w-4 rounded border-slate-300 text-teal-600"
                  defaultChecked
                  name="includeInStats"
                  type="checkbox"
                />
                计入首页资产统计
              </label>
              <Button className="w-full" type="submit">
                <Plus className="h-4 w-4" />
                保存账户
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {accounts.length === 0 ? (
            <Card>
              <CardContent className="pt-5 text-sm text-slate-600">
                还没有账户。新增后会同时生成一条初始金额记录。
              </CardContent>
            </Card>
          ) : (
            accounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div>
                    <p className="font-medium text-slate-900">{account.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {accountTypeLabels[account.type]} ·{" "}
                      {accountCategoryLabels[account.category]}
                      {!account.includeInStats ? " · 不计入统计" : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-semibold">
                    {formatCents(account.currentAmount)}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MobileShell>
  );
}
