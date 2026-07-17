"use client";

import {
  browserSupportsWebAuthn,
  startRegistration,
} from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/server";
import { Fingerprint, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  passkeyErrorMessage,
  requestJson,
} from "@/lib/passkey-client";

export type PasskeyListItem = {
  id: string;
  name: string;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

function formatDay(value: string) {
  return value.slice(0, 10).replaceAll("-", ".");
}

export function PasskeyManager({ passkeys }: { passkeys: PasskeyListItem[] }) {
  const router = useRouter();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSupported(window.isSecureContext && browserSupportsWebAuthn());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  async function registerPasskey() {
    setPending(true);
    setMessage("");
    setError("");

    try {
      const optionsJSON =
        await requestJson<PublicKeyCredentialCreationOptionsJSON>(
          "/api/passkeys/registration/options",
          { method: "POST" },
        );
      const registration = await startRegistration({ optionsJSON });

      await requestJson<{ verified: true }>(
        "/api/passkeys/registration/verify",
        {
          method: "POST",
          body: JSON.stringify(registration),
        },
      );
      setMessage("通行密钥已创建，现在可以在登录页使用。");
      router.refresh();
    } catch (caught) {
      setError(passkeyErrorMessage(caught, "创建通行密钥失败，请重试"));
    } finally {
      setPending(false);
    }
  }

  async function removePasskey(passkey: PasskeyListItem) {
    if (!window.confirm(`确定删除“${passkey.name}”吗？`)) {
      return;
    }

    setDeletingId(passkey.id);
    setMessage("");
    setError("");

    try {
      await requestJson<{ deleted: true }>(
        `/api/passkeys/${encodeURIComponent(passkey.id)}`,
        { method: "DELETE" },
      );
      setMessage("通行密钥已删除。");
      router.refresh();
    } catch (caught) {
      setError(passkeyErrorMessage(caught, "删除通行密钥失败，请重试"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm leading-6 text-[#3a3a3c]">
          使用 Face ID、Touch ID 或设备解锁登录，不再需要输入密码。
        </p>
        <p className="mt-1 text-xs leading-5 text-[#6e6e73]">
          iCloud 钥匙串开启后，通行密钥可在你的 Apple 设备间同步。
        </p>
      </div>

      <Button
        className="w-full disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        disabled={supported !== true || pending}
        onClick={registerPasskey}
      >
        <Fingerprint className="h-5 w-5" />
        {pending ? "正在创建…" : "创建通行密钥"}
      </Button>

      {supported === false ? (
        <p className="text-xs leading-5 text-[#ff3b30]">
          当前浏览器或连接不支持通行密钥。iPhone 上请使用 HTTPS 域名访问。
        </p>
      ) : null}

      {passkeys.length > 0 ? (
        <div className="divide-y divide-black/[0.06] rounded-lg border border-black/[0.06] bg-white/70 px-3">
          {passkeys.map((passkey) => (
            <div
              className="flex items-center gap-3 py-3"
              key={passkey.id}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#007aff]/10 text-[#007aff]">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#1d1d1f]">
                  {passkey.name}
                </p>
                <p className="mt-0.5 text-xs text-[#6e6e73]">
                  {passkey.backedUp ? "已同步" : "仅此设备"} · 创建于{" "}
                  {formatDay(passkey.createdAt)}
                  {passkey.lastUsedAt
                    ? ` · 最近使用 ${formatDay(passkey.lastUsedAt)}`
                    : ""}
                </p>
              </div>
              <Button
                aria-label={`删除${passkey.name}`}
                className="h-9 w-9 shrink-0 px-0 text-[#ff3b30] disabled:opacity-50"
                variant="ghost"
                type="button"
                disabled={deletingId === passkey.id}
                onClick={() => removePasskey(passkey)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-black/[0.025] px-3 py-3 text-xs leading-5 text-[#6e6e73]">
          还没有绑定通行密钥。首次创建前请保留当前密码，以防设备不可用。
        </p>
      )}

      {message ? (
        <p aria-live="polite" className="text-xs leading-5 text-[#34c759]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p aria-live="polite" className="text-xs leading-5 text-[#ff3b30]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
