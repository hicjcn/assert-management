export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  if (!response.ok) {
    throw new Error(body?.error || "请求失败，请稍后重试");
  }

  return body as T;
}

export function passkeyErrorMessage(error: unknown, fallback: string) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "未完成通行密钥验证，可能已取消操作";
    }

    if (error.name === "InvalidStateError") {
      return "这个设备上的通行密钥已经绑定";
    }
  }

  return error instanceof Error ? error.message : fallback;
}
