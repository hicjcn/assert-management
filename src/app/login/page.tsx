import { Lock } from "lucide-react";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSession } from "@/server/auth";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center bg-[#f5f5f7] px-5">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#007aff]/10">
            <Lock className="h-5 w-5 text-[#007aff]" />
          </div>
          <CardTitle className="text-base text-[#1d1d1f]">登录资产管家</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            <Input name="username" placeholder="用户名" autoComplete="username" />
            <Input
              name="password"
              type="password"
              placeholder="密码"
              autoComplete="current-password"
            />
            <Button className="w-full" type="submit">
              登录
            </Button>
            <p className="text-xs leading-5 text-[#6e6e73]">
              首次部署时，第一个登录的用户名会自动创建为管理员账号。
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
