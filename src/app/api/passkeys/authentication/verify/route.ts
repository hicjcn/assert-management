import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

import {
  finishPasskeyAuthentication,
  getPasskeyConfig,
  PasskeyFlowError,
} from "@/server/passkeys";

export async function POST(request: Request) {
  try {
    const response = (await request.json()) as AuthenticationResponseJSON;

    await finishPasskeyAuthentication(
      response,
      getPasskeyConfig(request.url),
    );

    return NextResponse.json({ verified: true });
  } catch (error) {
    if (error instanceof PasskeyFlowError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "暂时无法验证通行密钥，请稍后重试" },
      { status: 500 },
    );
  }
}
