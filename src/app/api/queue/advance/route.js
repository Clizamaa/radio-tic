import { NextResponse } from "next/server";
import { advance } from "@/lib/queueStore";

export async function POST() {
  const state = advance();
  return NextResponse.json(state);
}

