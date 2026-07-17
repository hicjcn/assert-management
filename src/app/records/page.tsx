import { Plus } from "lucide-react";

import { AccountChangeAmount } from "@/components/accounts/account-change-amount";
import { AccountMark } from "@/components/accounts/account-visual";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatShortDateTime, toDateTimeLocalValue } from "@/lib/date";
import { formatAccountCents } from "@/lib/money";
import {
  listAccountChanges,
  listAccounts,
} from "@/server/assets";
import { requireSession } from "@/server/auth";
import {
  accountCategoryLabels,
  changeTypeLabels,
  changeTypeValues,
} from "@/types/domain";
import { createAccountChangeAction } from "@/app/actions";

export default async function RecordsPage() {
  const session = await requireSession();
  const [accounts, changes] = await Promise.all([
    listAccounts(session.userId),
    listAccountChanges(session.userId),
  ]);

  const recordChangeHeader = (
    <details className="pt-2 [&>summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-normal text-[#1d1d1f] drop-shadow-[0_1px_0_rgba(255,255,255,0.72)]">
            变更记录
          </h1>
          <div className="mt-3 h-1 w-12 rounded-full bg-[#007aff]" />
        </div>
        <span className="-mr-1 mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#007aff] transition hover:bg-white/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007aff]">
          <Plus className="h-5 w-5" />
          <span className="sr-only">记录金额变更</span>
        </span>
      </summary>
      <div className="mt-4 rounded-lg border border-white/70 bg-white/80 px-4 pb-4 pt-3 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <form action={createAccountChangeAction} className="space-y-3">
          <select
            className="h-11 w-full rounded-lg border border-white/70 bg-white/85 px-3 text-base text-[#1d1d1f] shadow-sm shadow-black/[0.03] outline-none transition focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15"
            disabled={accounts.length === 0}
            name="accountId"
            required
          >
            <option value="">选择账户</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}（{accountCategoryLabels[account.category]}） ·{" "}
                {formatAccountCents(account.currentAmount, account)}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select
              className="h-11 rounded-lg border border-white/70 bg-white/85 px-3 text-base text-[#1d1d1f] shadow-sm shadow-black/[0.03] outline-none transition focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15"
              name="type"
              required
            >
              {changeTypeValues
                .filter((type) => type !== "initial")
                .map((type) => (
                  <option key={type} value={type}>
                    {changeTypeLabels[type]}
                  </option>
                ))}
            </select>
            <Input inputMode="decimal" name="amount" placeholder="金额" required />
          </div>
          <Input
            defaultValue={toDateTimeLocalValue(new Date())}
            name="changedAt"
            type="datetime-local"
            required
          />
          <Input name="note" placeholder="备注，可选" />
          <Button
            className="w-full"
            disabled={accounts.length === 0}
            type="submit"
          >
            保存变更
          </Button>
          {accounts.length === 0 ? (
            <p className="text-xs text-[#6e6e73]">
              先新增账户，再记录金额变更。
            </p>
          ) : null}
        </form>
      </div>
    </details>
  );

  return (
    <MobileShell header={recordChangeHeader} title="变更记录">
      <div className="space-y-4">
        <div className="space-y-3">
          {changes.length === 0 ? (
            <Card>
              <CardContent className="pt-5 text-sm text-[#3a3a3c]">
                暂无变更记录。
              </CardContent>
            </Card>
          ) : (
            changes.map((change) => (
              <Card key={change.id}>
                <CardContent className="space-y-2 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <AccountMark
                        category={change.category}
                        className="h-9 w-9"
                        iconKey={change.iconKey}
                        name={change.accountName}
                        variant="soft"
                      />
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="min-w-0 truncate font-medium text-[#1d1d1f]">
                            {change.accountName}
                          </p>
                          <span className="inline-flex h-4 shrink-0 items-center rounded-full bg-black/[0.05] px-1 text-[9px] font-medium text-[#6e6e73]">
                            {accountCategoryLabels[change.category]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#86868b]">
                          {changeTypeLabels[change.type]} ·{" "}
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
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MobileShell>
  );
}
