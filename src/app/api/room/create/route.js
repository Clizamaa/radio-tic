import { NextResponse } from "next/server";
import { createRoom } from "@/lib/queueStore";

export async function POST() {
  const { code, adminToken } = createRoom();
  return NextResponse.json({ code, adminToken });
}
