"use client";

import {
  browserSupportsWebAuthn,
  startAuthentication,
} from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/server";
import { Fingerprint } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  passkeyErrorMessage,
  requestJson,
} from "@/lib/passkey-client";

export function PasskeyLoginButton() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSupported(window.isSecureContext && browserSupportsWebAuthn());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  async function loginWithPasskey() {
    setPending(true);
    setError("");

    try {
      const optionsJSON =
        await requestJson<PublicKeyCredentialRequestOptionsJSON>(
          "/api/passkeys/authentication/options",
          { method: "POST" },
        );
      const authentication = await startAuthentication({ optionsJSON });

      await requestJson<{ verified: true }>(
        "/api/passkeys/authentication/verify",
        {
          method: "POST",
          body: JSON.stringify(authentication),
        },
      );
      window.location.assign("/");
    } catch (caught) {
      setError(passkeyErrorMessage(caught, "通行密钥登录失败，请重试"));
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full disabled:cursor-not-allowed disabled:opacity-50"
        variant="secondary"
        type="button"
        disabled={supported !== true || pending}
        onClick={loginWithPasskey}
      >
        <Fingerprint className="h-5 w-5" />
        {pending ? "正在验证…" : "使用通行密钥登录"}
      </Button>
      {supported === false ? (
        <p className="text-xs leading-5 text-[#ff3b30]">
          当前浏览器或连接不支持通行密钥，请使用 HTTPS 访问。
        </p>
      ) : (
        <p className="text-center text-xs leading-5 text-[#6e6e73]">
          支持 Face ID、Touch ID 或设备解锁
        </p>
      )}
      {error ? (
        <p aria-live="polite" className="text-xs leading-5 text-[#ff3b30]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
