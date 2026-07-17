import { LogOut } from "lucide-react";

import { logoutAction } from "@/app/actions";
import { MobileShell } from "@/components/layout/mobile-shell";
import {
  PasskeyManager,
  type PasskeyListItem,
} from "@/components/settings/passkey-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/server/auth";
import { listPasskeys } from "@/server/passkeys";

export default async function SettingsPage() {
  const session = await requireSession();
  const passkeys = await listPasskeys(session.userId);
  const passkeyItems: PasskeyListItem[] = passkeys.map((passkey) => ({
    ...passkey,
    createdAt: passkey.createdAt.toISOString(),
    lastUsedAt: passkey.lastUsedAt?.toISOString() ?? null,
  }));

  return (
    <MobileShell title="设置">
      <Card>
        <CardHeader>
          <CardTitle>通行密钥</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <PasskeyManager passkeys={passkeyItems} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>账户与安全</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-black/[0.025] px-3 py-3">
            <span className="text-sm text-[#6e6e73]">当前用户</span>
            <span className="truncate text-sm font-medium text-[#1d1d1f]">
              {session.username}
            </span>
          </div>
          <form action={logoutAction}>
            <Button
              className="w-full text-[#ff3b30] hover:bg-[#ff3b30]/[0.06]"
              type="submit"
              variant="ghost"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </form>
        </CardContent>
      </Card>
    </MobileShell>
  );
}
