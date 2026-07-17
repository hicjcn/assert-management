import { MobileShell } from "@/components/layout/mobile-shell";
import {
  PasskeyManager,
  type PasskeyListItem,
} from "@/components/settings/passkey-manager";
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
        <CardContent className="pt-5 text-sm text-[#3a3a3c]">
          后续将在这里提供数据导出、密码修改、PWA 信息和部署配置检查。
        </CardContent>
      </Card>
    </MobileShell>
  );
}
