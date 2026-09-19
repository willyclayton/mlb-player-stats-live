import { NextResponse } from "next/server";
import { getPlayer } from "@/lib/mlb";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    return NextResponse.json({ error: "Invalid player id" }, { status: 400 });
  }
  try {
    const payload = await getPlayer(num);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Player lookup failed";
    const status = message.includes("not found") ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
