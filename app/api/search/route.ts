import { NextResponse } from "next/server";
import { searchPlayers } from "@/lib/mlb";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  try {
    const players = await searchPlayers(q);
    return NextResponse.json({ players });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
