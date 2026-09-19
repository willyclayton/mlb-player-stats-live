import { NextResponse } from "next/server";
import { getHome } from "@/lib/mlb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getHome();
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load slate";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
