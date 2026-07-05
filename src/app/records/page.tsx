import { AccountChangeAmount } from "@/components/accounts/account-change-amount";
import { AccountMark } from "@/components/accounts/account-visual";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

function toDateTimeLocalValue(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

export default async function RecordsPage() {
  const session = await requireSession();
  const [accounts, changes] = await Promise.all([
    listAccounts(session.userId),
    listAccountChanges(session.userId),
  ]);

  return (
    <MobileShell title="变更记录">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>记录金额变更</CardTitle>
          </CardHeader>
          <CardContent>
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
                    {account.name} ·{" "}
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
                <Input
                  inputMode="decimal"
                  name="amount"
                  placeholder="金额"
                  required
                />
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
          </CardContent>
        </Card>

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
                          {change.changedAt.toLocaleString("zh-CN", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
