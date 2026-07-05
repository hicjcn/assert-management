import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/server/auth";

export default async function SettingsPage() {
  await requireSession();

  return (
    <MobileShell title="设置">
      <Card>
        <CardContent className="pt-5 text-sm text-[#3a3a3c]">
          这里将提供数据导出、密码修改、PWA 信息和部署配置检查。
        </CardContent>
      </Card>
    </MobileShell>
  );
}
