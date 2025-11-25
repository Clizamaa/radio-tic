import { NextResponse } from "next/server";
import { getState } from "@/lib/queueStore";

export async function GET() {
  return NextResponse.json(getState());
}

