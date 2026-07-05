import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountActionPanel } from "@/components/accounts/account-action-panel";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAccountCents, formatAccountChangeCents } from "@/lib/money";
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

  return (
    <MobileShell title="账户详情">
      <div className="space-y-4">
        <Link
          className="inline-flex h-9 items-center gap-2 text-sm font-medium text-slate-600"
          href="/accounts"
        >
          <ArrowLeft className="h-4 w-4" />
          返回账户
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>账户信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {account.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {accountTypeLabels[account.type]} ·{" "}
                  {accountCategoryLabels[account.category]}
                  {!account.includeInStats ? " · 不计入统计" : ""}
                </p>
              </div>
              <p className="shrink-0 text-xl font-semibold">
                {formatAccountCents(account.currentAmount, account)}
              </p>
            </div>
            {account.note ? (
              <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                {account.note}
              </p>
            ) : null}

            <AccountActionPanel
              accountId={account.id}
              amountInputValue={amountInputValue}
              category={account.category}
              includeInStats={account.includeInStats}
              name={account.name}
              note={account.note ?? ""}
              redirectTo={redirectTo}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>账户变更记录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {changes.length === 0 ? (
              <p className="text-slate-500">暂无变更记录。</p>
            ) : (
              changes.map((change) => (
                <div
                  className="space-y-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                  key={change.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {changeTypeLabels[change.type]}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
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
                  <div className="flex justify-between text-xs text-slate-500">
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
                    <p className="text-sm text-slate-600">{change.note}</p>
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
