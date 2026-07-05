import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

import { createAccountAction } from "@/app/actions";
import {
  AccountMark,
  AccountTypeBadge,
  getAccountVisual,
} from "@/components/accounts/account-visual";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatAccountCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { listAccounts } from "@/server/assets";
import { requireSession } from "@/server/auth";
import {
  type AccountCategory,
  accountCategoryDescriptions,
  accountCategoryLabels,
  accountCategoryValues,
  accountIconLabels,
  accountIconValues,
  accountTypeLabels,
} from "@/types/domain";

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
        <details className="rounded-lg border border-white/70 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl [&>summary::-webkit-details-marker]:hidden">
          <summary className="flex h-12 cursor-pointer items-center justify-between px-4 text-sm font-semibold text-[#1d1d1f]">
            <span>新增账户</span>
            <Plus className="h-4 w-4 text-[#007aff]" />
          </summary>
          <div className="border-t border-black/[0.06] px-4 pb-4 pt-3">
            <form action={createAccountAction} className="space-y-3">
              <Input name="name" placeholder="账户名称" required />
              <select
                className="h-11 w-full rounded-lg border border-white/70 bg-white/85 px-3 text-base text-[#1d1d1f] shadow-sm shadow-black/[0.03] outline-none transition focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15"
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
              <select
                className="h-11 w-full rounded-lg border border-white/70 bg-white/85 px-3 text-base text-[#1d1d1f] shadow-sm shadow-black/[0.03] outline-none transition focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15"
                name="iconKey"
              >
                <option value="">自动匹配图标</option>
                {accountIconValues.map((iconKey) => (
                  <option key={iconKey} value={iconKey}>
                    {accountIconLabels[iconKey]}
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
              <label className="flex items-center gap-2 text-sm text-[#3a3a3c]">
                <input
                  className="h-4 w-4 rounded border-[#c7c7cc] text-[#007aff]"
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
            <Card className="overflow-hidden border-dashed border-[#c7c7cc]">
              <CardContent className="flex items-center gap-3 pt-5 text-sm text-[#3a3a3c]">
                <AccountMark category="debit_card" variant="soft" />
                <span>还没有账户。新增后会同时生成一条初始金额记录。</span>
              </CardContent>
            </Card>
          ) : (
            groupedAccounts.map((group) => {
              const visual = getAccountVisual(group.category);

              return (
                <Card
                  className={cn("overflow-hidden", visual.border)}
                  key={group.category}
                >
                  <CardHeader className="relative flex flex-row items-center justify-between gap-3 bg-white/55 pb-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <AccountMark category={group.category} />
                      <div className="min-w-0">
                        <CardTitle className={cn("text-sm", visual.text)}>
                          {accountCategoryLabels[group.category]}
                        </CardTitle>
                        <p className="mt-1 text-xs text-[#86868b]">
                          {group.items.length} 个账户
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-[#86868b]">小计</p>
                      <p
                        className={cn("text-base font-semibold", visual.amount)}
                      >
                        {formatAccountCents(group.total, {
                          category: group.category,
                        })}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "absolute inset-x-0 bottom-0 h-1",
                        visual.accent,
                      )}
                    />
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="space-y-2">
                      {group.items.map((account) => (
                        <Link
                          className="flex min-h-20 items-center justify-between gap-3 rounded-lg border border-white/70 bg-white/70 p-3 shadow-sm shadow-black/[0.03] transition hover:bg-white"
                          href={`/accounts/${account.id}`}
                          key={account.id}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <AccountMark
                              category={account.category}
                              className="h-10 w-10"
                              iconKey={account.iconKey}
                              name={account.name}
                              variant="soft"
                            />
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <p className="min-w-0 truncate font-medium text-[#1d1d1f]">
                                  {account.name}
                                </p>
                                <AccountTypeBadge
                                  className="h-4 shrink-0 px-1 text-[9px]"
                                  type={account.type}
                                >
                                  {accountTypeLabels[account.type]}
                                </AccountTypeBadge>
                                {!account.includeInStats ? (
                                  <span className="inline-flex h-4 shrink-0 items-center rounded-full bg-black/[0.05] px-1 text-[9px] font-medium text-[#6e6e73]">
                                    不计入统计
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <p
                              className={cn(
                                "text-base font-semibold",
                                visual.amount,
                              )}
                            >
                              {formatAccountCents(
                                account.currentAmount,
                                account,
                              )}
                            </p>
                            <ChevronRight className="h-4 w-4 text-[#c7c7cc]" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </MobileShell>
  );
}
