import { NextResponse } from "next/server";

import { requireSession } from "@/server/auth";
import { getCharts } from "@/server/assets";

export async function GET() {
  const session = await requireSession();
  const charts = await getCharts(session.userId);

  return NextResponse.json(charts);
}
