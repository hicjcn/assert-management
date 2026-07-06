import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountActionPanel } from "@/components/accounts/account-action-panel";
import { AccountChangeAmount } from "@/components/accounts/account-change-amount";
import {
  AccountMark,
  AccountTypeBadge,
  getAccountVisual,
} from "@/components/accounts/account-visual";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShortDateTime } from "@/lib/date";
import { formatAccountCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { getAccount, listAccountChanges } from "@/server/assets";
import { requireSession } from "@/server/auth";
import {
  accountCategoryLabels,
  accountTypeLabels,
  changeTypeLabels,
} from "@/types/domain";

function formatCentsForInput(value: bigint | number) {
  const cents = typeof value === "bigint" ? value : BigInt(value);
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const yuan = (absolute + 50n) / 100n;

  return `${negative ? "-" : ""}${yuan.toString()}`;
}

type AccountDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AccountDetailPage({
  params,
}: AccountDetailPageProps) {
  const { id } = await params;
  const session = await requireSession();
  const [account, changes] = await Promise.all([
    getAccount(session.userId, id),
    listAccountChanges(session.userId, id),
  ]);

  if (!account) {
    notFound();
  }

  const redirectTo = `/accounts/${account.id}`;
  const amountInputValue = formatCentsForInput(account.currentAmount);
  const visual = getAccountVisual(account.category);

  return (
    <MobileShell title="账户详情">
      <div className="space-y-4">
        <Link
          className="inline-flex h-9 items-center gap-2 text-sm font-semibold text-[#3a3a3c]"
          href="/accounts"
        >
          <ArrowLeft className="h-4 w-4" />
          返回账户
        </Link>

        <Card className={cn("overflow-hidden", visual.border)}>
          <div className={cn("relative px-4 pb-5 pt-4", visual.softSurface)}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <AccountMark
                  category={account.category}
                  className="mb-4 h-12 w-12"
                  iconKey={account.iconKey}
                  name={account.name}
                />
                <div className="flex min-w-0 items-center gap-2">
                  <p className="min-w-0 truncate text-xl font-semibold text-[#1d1d1f]">
                    {account.name}
                  </p>
                  <AccountTypeBadge
                    className="h-4 shrink-0 px-1.5 text-[9px]"
                    type={account.type}
                  >
                    {accountTypeLabels[account.type]}
                  </AccountTypeBadge>
                  {!account.includeInStats ? (
                    <span className="inline-flex h-4 shrink-0 items-center rounded-full bg-white/80 px-1.5 text-[9px] font-medium text-[#6e6e73]">
                      不计入统计
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-6 items-center rounded-full bg-white/80 px-2 text-xs font-medium text-[#3a3a3c]">
                    {accountCategoryLabels[account.category]}
                  </span>
                </div>
                {account.note ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#3a3a3c]">
                    {account.note}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 pt-1 text-right">
                <p className="text-xs font-medium text-[#86868b]">当前金额</p>
                <p className={cn("mt-1 text-2xl font-semibold", visual.amount)}>
                  {formatAccountCents(account.currentAmount, account)}
                </p>
              </div>
            </div>
            <span
              className={cn("absolute inset-x-0 bottom-0 h-1", visual.accent)}
            />
          </div>

          <CardContent className="space-y-3 pt-4">
            <AccountActionPanel
              accountId={account.id}
              amountInputValue={amountInputValue}
              category={account.category}
              iconKey={account.iconKey}
              includeInStats={account.includeInStats}
              name={account.name}
              note={account.note ?? ""}
              redirectTo={redirectTo}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>账户变更记录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {changes.length === 0 ? (
              <p className="text-[#6e6e73]">暂无变更记录。</p>
            ) : (
              changes.map((change) => (
                <div
                  className="space-y-2 border-b border-black/[0.06] pb-3 last:border-0 last:pb-0"
                  key={change.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <AccountMark
                        category={change.category}
                        className="h-9 w-9"
                        iconKey={change.iconKey}
                        name={account.name}
                        variant="soft"
                      />
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="min-w-0 truncate font-medium text-[#1d1d1f]">
                            {changeTypeLabels[change.type]}
                          </p>
                          <span className="inline-flex h-4 shrink-0 items-center rounded-full bg-black/[0.05] px-1 text-[9px] font-medium text-[#6e6e73]">
                            {accountCategoryLabels[change.category]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#86868b]">
                          {formatShortDateTime(change.changedAt)}
                        </p>
                      </div>
                    </div>
                    <AccountChangeAmount
                      account={{
                        category: change.category,
                      }}
                      change={change}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[#86868b]">
                    <span>
                      变更前{" "}
                      {formatAccountCents(change.beforeAmount, {
                        category: change.category,
                      })}
                    </span>
                    <span>
                      变更后{" "}
                      {formatAccountCents(change.afterAmount, {
                        category: change.category,
                      })}
                    </span>
                  </div>
                  {change.note ? (
                    <p className="text-sm text-[#3a3a3c]">{change.note}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </MobileShell>
  );
}
