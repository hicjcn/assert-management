import { Plus, Save, Trash2 } from "lucide-react";

import {
  createAccountAction,
  deleteAccountAction,
  updateAccountAction,
} from "@/app/actions";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatAccountCents } from "@/lib/money";
import { listAccounts } from "@/server/assets";
import { requireSession } from "@/server/auth";
import {
  type AccountCategory,
  accountCategoryDescriptions,
  accountCategoryLabels,
  accountCategoryValues,
  accountTypeLabels,
} from "@/types/domain";

function formatCentsForInput(value: bigint | number) {
  const cents = typeof value === "bigint" ? value : BigInt(value);
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const yuan = (absolute + 50n) / 100n;

  return `${negative ? "-" : ""}${yuan.toString()}`;
}

export default async function AccountsPage() {
  const session = await requireSession();
  const accounts = await listAccounts(session.userId);
  const groupedAccounts = accountCategoryValues
    .map((category) => {
      const items = accounts.filter((account) => account.category === category);
      const total = items.reduce(
        (sum, account) => sum + account.currentAmount,
        0n,
      );

      return { category, items, total };
    })
    .filter(
      (
        group,
      ): group is {
        category: AccountCategory;
        items: typeof accounts;
        total: bigint;
      } => group.items.length > 0,
    );

  return (
    <MobileShell title="账户">
      <div className="space-y-4">
        <details className="rounded-lg border border-slate-200 bg-white shadow-sm [&>summary::-webkit-details-marker]:hidden">
          <summary className="flex h-12 cursor-pointer items-center justify-between px-4 text-sm font-medium text-slate-900">
            <span>新增账户</span>
            <Plus className="h-4 w-4 text-teal-600" />
          </summary>
          <div className="border-t border-slate-100 px-4 pb-4 pt-3">
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
                    {accountCategoryDescriptions[category]
                      ? `（${accountCategoryDescriptions[category]}）`
                      : ""}
                  </option>
                ))}
              </select>
              <Input
                inputMode="decimal"
                name="currentAmount"
                placeholder="当前余额，如 1200"
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
          </div>
        </details>

        <div className="space-y-3">
          {accounts.length === 0 ? (
            <Card>
              <CardContent className="pt-5 text-sm text-slate-600">
                还没有账户。新增后会同时生成一条初始金额记录。
              </CardContent>
            </Card>
          ) : (
            groupedAccounts.map((group) => (
              <Card key={group.category}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{accountCategoryLabels[group.category]}</CardTitle>
                    <p className="mt-1 text-xs text-slate-500">
                      {group.items.length} 个账户
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatAccountCents(group.total, {
                      category: group.category,
                    })}
                  </p>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="divide-y divide-slate-100">
                    {group.items.map((account) => (
                      <details
                        className="py-3 first:pt-0 last:pb-0 [&>summary::-webkit-details-marker]:hidden"
                        key={account.id}
                      >
                        <summary className="flex cursor-pointer items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {account.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {accountTypeLabels[account.type]}
                              {!account.includeInStats ? " · 不计入统计" : ""}
                            </p>
                          </div>
                          <p className="shrink-0 text-base font-semibold">
                            {formatAccountCents(account.currentAmount, account)}
                          </p>
                        </summary>
                        <div className="mt-3 rounded-md bg-slate-50 p-3">
                          <form action={updateAccountAction} className="space-y-3">
                            <input
                              name="accountId"
                              type="hidden"
                              value={account.id}
                            />
                            <Input
                              defaultValue={account.name}
                              name="name"
                              placeholder="账户名称"
                              required
                            />
                            <Input
                              defaultValue={formatCentsForInput(
                                account.currentAmount,
                              )}
                              inputMode="decimal"
                              name="currentAmount"
                              placeholder="当前余额"
                              required
                            />
                            <Input
                              defaultValue={account.note ?? ""}
                              name="note"
                              placeholder="备注，可选"
                            />
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                              <input
                                className="h-4 w-4 rounded border-slate-300 text-teal-600"
                                defaultChecked={account.includeInStats}
                                name="includeInStats"
                                type="checkbox"
                              />
                              计入首页资产统计
                            </label>
                            <Button className="w-full" type="submit">
                              <Save className="h-4 w-4" />
                              保存修改
                            </Button>
                          </form>
                          <form action={deleteAccountAction} className="mt-2">
                            <input
                              name="accountId"
                              type="hidden"
                              value={account.id}
                            />
                            <Button
                              className="w-full text-rose-600 hover:bg-rose-50"
                              type="submit"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4" />
                              删除账户
                            </Button>
                          </form>
                        </div>
                      </details>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MobileShell>
  );
}
