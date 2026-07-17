import {
  ArrowRight,
  KeyRound,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/actions";
import { PasskeyLoginButton } from "@/components/auth/passkey-login-button";
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
    <main className="relative isolate min-h-svh overflow-hidden bg-[#f5f5f7] px-5 py-8 sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_8%_12%,rgba(0,122,255,0.16),transparent_30%),radial-gradient(circle_at_92%_84%,rgba(88,86,214,0.13),transparent_30%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-[-5rem] top-[18%] -z-10 h-48 w-48 rounded-full bg-[#64d2ff]/20 blur-3xl sm:h-72 sm:w-72"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] -z-10 h-64 w-64 rounded-full bg-[#bf5af2]/10 blur-3xl sm:h-80 sm:w-80"
        aria-hidden="true"
      />

      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full items-center justify-center">
        <section className="w-full max-w-[27rem]" aria-labelledby="login-title">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1687ff] to-[#5856d6] text-white shadow-[0_10px_24px_rgba(0,122,255,0.24)]">
              <WalletCards className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-[#1d1d1f]">
                资产管家
              </p>
              <p className="text-[11px] text-[#86868b]">你的私人资产工作台</p>
            </div>
          </div>

          <Card className="w-full rounded-[1.75rem] border-white/85 bg-white/72 shadow-[0_24px_70px_rgba(31,38,56,0.12)] backdrop-blur-2xl">
            <CardHeader className="px-6 pt-6 sm:px-8 sm:pt-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#007aff]/10">
                <Sparkles className="h-5 w-5 text-[#007aff]" strokeWidth={2} />
              </div>
              <CardTitle
                id="login-title"
                className="text-2xl font-semibold tracking-[-0.025em] text-[#1d1d1f]"
              >
                欢迎回来
              </CardTitle>
              <p className="mt-2 text-sm leading-6 text-[#6e6e73]">
                登录后继续查看你的资产概览
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
              <form action={loginAction} className="space-y-4">
                <div className="space-y-2">
                  <label
                    className="text-[13px] font-medium text-[#3a3a3c]"
                    htmlFor="username"
                  >
                    用户名
                  </label>
                  <div className="relative">
                    <UserRound
                      className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#86868b]"
                      aria-hidden="true"
                    />
                    <Input
                      id="username"
                      className="h-12 rounded-xl border-black/[0.07] bg-white/90 pl-11 shadow-none"
                      name="username"
                      placeholder="请输入用户名"
                      autoComplete="username webauthn"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    className="text-[13px] font-medium text-[#3a3a3c]"
                    htmlFor="password"
                  >
                    密码
                  </label>
                  <div className="relative">
                    <KeyRound
                      className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#86868b]"
                      aria-hidden="true"
                    />
                    <Input
                      id="password"
                      className="h-12 rounded-xl border-black/[0.07] bg-white/90 pl-11 shadow-none"
                      name="password"
                      type="password"
                      placeholder="请输入密码"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>
                <Button
                  className="h-12 w-full rounded-xl shadow-[0_10px_24px_rgba(0,122,255,0.23)]"
                  type="submit"
                >
                  登录
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3" aria-hidden="true">
                <div className="h-px flex-1 bg-black/[0.07]" />
                <span className="text-[11px] font-medium text-[#86868b]">
                  快捷登录
                </span>
                <div className="h-px flex-1 bg-black/[0.07]" />
              </div>
              <PasskeyLoginButton />

              <div className="mt-5 flex gap-2.5 rounded-xl bg-[#f5f5f7]/90 px-3.5 py-3">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#34c759]"
                  aria-hidden="true"
                />
                <p className="text-xs leading-5 text-[#6e6e73]">
                  首次部署时，首次登录的用户名将自动创建为管理员账号。
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="mt-5 text-center text-[11px] text-[#86868b]">
            安全连接 · 私有数据 · 专注资产管理
          </p>
        </section>
      </div>
    </main>
  );
}
