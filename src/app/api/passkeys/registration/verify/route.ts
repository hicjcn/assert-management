import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

import { getSession } from "@/server/auth";
import {
  finishPasskeyRegistration,
  getPasskeyConfig,
  PasskeyFlowError,
} from "@/server/passkeys";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const response = (await request.json()) as RegistrationResponseJSON;

    await finishPasskeyRegistration(
      session.userId,
      response,
      getPasskeyConfig(request.url),
    );

    return NextResponse.json({ verified: true });
  } catch (error) {
    if (error instanceof PasskeyFlowError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "暂时无法保存通行密钥，请稍后重试" },
      { status: 500 },
    );
  }
}
