import { ArrowLeft, Pencil, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteAccountAction, updateAccountAction } from "@/app/actions";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatAccountCents } from "@/lib/money";
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
          </CardContent>
        </Card>

        <details className="rounded-lg border border-slate-200 bg-white shadow-sm [&>summary::-webkit-details-marker]:hidden">
          <summary className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-teal-600 px-4 text-sm font-medium text-white transition hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
            <Save className="h-4 w-4" />
            更新余额
          </summary>
          <div className="border-t border-slate-100 px-4 pb-4 pt-3">
            <CardTitle>更新余额</CardTitle>
            <form action={updateAccountAction} className="mt-3 space-y-3">
              <input name="accountId" type="hidden" value={account.id} />
              <input name="redirectTo" type="hidden" value={redirectTo} />
              <input name="name" type="hidden" value={account.name} />
              <input name="note" type="hidden" value={account.note ?? ""} />
              {account.includeInStats ? (
                <input name="includeInStats" type="hidden" value="on" />
              ) : null}
              <Input
                defaultValue={amountInputValue}
                inputMode="decimal"
                name="currentAmount"
                placeholder="当前余额"
                required
              />
              <Button className="w-full" type="submit">
                <Save className="h-4 w-4" />
                保存余额
              </Button>
            </form>
          </div>
        </details>

        <details className="rounded-lg border border-slate-200 bg-white shadow-sm [&>summary::-webkit-details-marker]:hidden">
          <summary className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
            <Pencil className="h-4 w-4" />
            编辑信息
          </summary>
          <div className="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3">
            <CardTitle>编辑信息</CardTitle>
            <form action={updateAccountAction} className="mt-3 space-y-3">
              <input name="accountId" type="hidden" value={account.id} />
              <input name="redirectTo" type="hidden" value={redirectTo} />
              <input
                name="currentAmount"
                type="hidden"
                value={amountInputValue}
              />
              <Input
                defaultValue={account.name}
                name="name"
                placeholder="账户名称"
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
                保存信息
              </Button>
            </form>
            <form action={deleteAccountAction}>
              <input name="accountId" type="hidden" value={account.id} />
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
                      {formatAccountCents(
                        change.changeAmount,
                        { category: change.category },
                        { signed: true },
                      )}
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
