import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
            <Lock className="h-5 w-5 text-slate-700" />
          </div>
          <CardTitle>登录资产管家</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
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
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
