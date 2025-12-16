import { NextResponse } from "next/server";
import { advance } from "@/lib/queueStore";

export async function POST(req) {
  const body = await req.json();
  const { roomCode } = body || {};

  if (!roomCode) {
    return NextResponse.json({ error: "roomCode es requerido" }, { status: 400 });
  }

  const state = advance(roomCode);
  if (!state) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  }
  return NextResponse.json(state);
}
