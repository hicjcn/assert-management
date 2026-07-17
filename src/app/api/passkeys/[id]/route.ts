import { NextResponse } from "next/server";

import { getSession } from "@/server/auth";
import { deletePasskey, PasskeyFlowError } from "@/server/passkeys";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    await deletePasskey(session.userId, id);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof PasskeyFlowError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "暂时无法删除通行密钥，请稍后重试" },
      { status: 500 },
    );
  }
}
