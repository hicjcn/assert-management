"use client";

import { Pencil, Save, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  deleteAccountAction,
  updateAccountAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type AccountCategory,
  accountCategoryDescriptions,
  accountCategoryLabels,
  accountCategoryValues,
  accountIconLabels,
  accountIconValues,
} from "@/types/domain";

type ActivePanel = "balance" | "info" | null;

type AccountActionPanelProps = {
  accountId: string;
  amountInputValue: string;
  category: AccountCategory;
  iconKey?: string | null;
  includeInStats: boolean;
  name: string;
  note: string;
  redirectTo: string;
};

export function AccountActionPanel({
  accountId,
  amountInputValue,
  category,
  iconKey,
  includeInStats,
  name,
  note,
  redirectTo,
}: AccountActionPanelProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <button
          className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-white/70 bg-white/85 px-3 text-xs font-semibold text-[#1d1d1f] shadow-sm shadow-black/[0.04] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007aff]"
          onClick={() => setActivePanel(activePanel === "info" ? null : "info")}
          type="button"
        >
          <Pencil className="h-3.5 w-3.5" />
          编辑信息
        </button>
        <button
          className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-[#007aff] px-3 text-xs font-semibold text-white shadow-sm shadow-[#007aff]/25 transition hover:bg-[#006ee6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007aff]"
          onClick={() =>
            setActivePanel(activePanel === "balance" ? null : "balance")
          }
          type="button"
        >
          <Save className="h-3.5 w-3.5" />
          更新余额
        </button>
      </div>

      {activePanel === "balance" ? (
        <div className="rounded-lg border border-white/70 bg-white/60 p-3 shadow-inner shadow-black/[0.02]">
          <CardTitle>更新余额</CardTitle>
          <form action={updateAccountAction} className="mt-3 space-y-3">
            <input name="accountId" type="hidden" value={accountId} />
            <input name="redirectTo" type="hidden" value={redirectTo} />
            <input name="name" type="hidden" value={name} />
            <input name="category" type="hidden" value={category} />
            <input name="iconKey" type="hidden" value={iconKey ?? ""} />
            <input name="note" type="hidden" value={note} />
            {includeInStats ? (
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
      ) : null}

      {activePanel === "info" ? (
        <div className="space-y-3 rounded-lg border border-white/70 bg-white/60 p-3 shadow-inner shadow-black/[0.02]">
          <CardTitle>编辑信息</CardTitle>
          <form action={updateAccountAction} className="mt-3 space-y-3">
            <input name="accountId" type="hidden" value={accountId} />
            <input name="redirectTo" type="hidden" value={redirectTo} />
            <input
              name="currentAmount"
              type="hidden"
              value={amountInputValue}
            />
            <Input defaultValue={name} name="name" placeholder="账户名称" required />
            <select
              className="h-11 w-full rounded-lg border border-white/70 bg-white/85 px-3 text-base text-[#1d1d1f] shadow-sm shadow-black/[0.03] outline-none transition focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15"
              defaultValue={category}
              name="category"
              required
            >
              {accountCategoryValues.map((categoryValue) => (
                <option key={categoryValue} value={categoryValue}>
                  {accountCategoryLabels[categoryValue]}
                  {accountCategoryDescriptions[categoryValue]
                    ? `（${accountCategoryDescriptions[categoryValue]}）`
                    : ""}
                </option>
              ))}
            </select>
            <select
              className="h-11 w-full rounded-lg border border-white/70 bg-white/85 px-3 text-base text-[#1d1d1f] shadow-sm shadow-black/[0.03] outline-none transition focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15"
              defaultValue={iconKey ?? ""}
              name="iconKey"
            >
              <option value="">自动匹配图标</option>
              {accountIconValues.map((accountIcon) => (
                <option key={accountIcon} value={accountIcon}>
                  {accountIconLabels[accountIcon]}
                </option>
              ))}
            </select>
            <Input defaultValue={note} name="note" placeholder="备注，可选" />
            <label className="flex items-center gap-2 text-sm text-[#3a3a3c]">
              <input
                className="h-4 w-4 rounded border-[#c7c7cc] text-[#007aff]"
                defaultChecked={includeInStats}
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
            <input name="accountId" type="hidden" value={accountId} />
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
      ) : null}
    </div>
  );
}
