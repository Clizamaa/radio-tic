import { NextResponse } from "next/server";
import { roomExists } from "@/lib/queueStore";

export async function POST(req) {
  const body = await req.json();
  const { code } = body;
  
  if (!code) {
    return NextResponse.json({ error: "Código requerido" }, { status: 400 });
  }

  const exists = roomExists(code);
  return NextResponse.json({ valid: exists });
}
