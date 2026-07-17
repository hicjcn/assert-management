import { NextResponse } from "next/server";

import {
  createPasskeyAuthenticationOptions,
  getPasskeyConfig,
  PasskeyFlowError,
} from "@/server/passkeys";

export async function POST(request: Request) {
  try {
    const options = await createPasskeyAuthenticationOptions(
      getPasskeyConfig(request.url),
    );

    return NextResponse.json(options);
  } catch (error) {
    if (error instanceof PasskeyFlowError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "暂时无法使用通行密钥，请稍后重试" },
      { status: 500 },
    );
  }
}
