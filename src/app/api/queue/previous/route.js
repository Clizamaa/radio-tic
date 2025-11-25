import { NextResponse } from "next/server";
import { previous } from "@/lib/queueStore";

export async function POST() {
  const state = previous();
  return NextResponse.json(state);
}

