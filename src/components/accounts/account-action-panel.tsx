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

type ActivePanel = "balance" | "info" | null;

type AccountActionPanelProps = {
  accountId: string;
  amountInputValue: string;
  includeInStats: boolean;
  name: string;
  note: string;
  redirectTo: string;
};

export function AccountActionPanel({
  accountId,
  amountInputValue,
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
          className="inline-flex h-9 items-center justify-center gap-1 rounded-md bg-slate-100 px-3 text-xs font-medium text-slate-900 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
          onClick={() => setActivePanel(activePanel === "info" ? null : "info")}
          type="button"
        >
          <Pencil className="h-3.5 w-3.5" />
          编辑信息
        </button>
        <button
          className="inline-flex h-9 items-center justify-center gap-1 rounded-md bg-teal-600 px-3 text-xs font-medium text-white transition hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
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
        <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
          <CardTitle>更新余额</CardTitle>
          <form action={updateAccountAction} className="mt-3 space-y-3">
            <input name="accountId" type="hidden" value={accountId} />
            <input name="redirectTo" type="hidden" value={redirectTo} />
            <input name="name" type="hidden" value={name} />
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
        <div className="space-y-3 rounded-md border border-slate-100 bg-slate-50 p-3">
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
            <Input defaultValue={note} name="note" placeholder="备注，可选" />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                className="h-4 w-4 rounded border-slate-300 text-teal-600"
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
