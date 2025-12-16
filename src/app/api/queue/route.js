import { NextResponse } from "next/server";
import { getState } from "@/lib/queueStore";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomCode = searchParams.get("roomCode");

  if (!roomCode) {
    return NextResponse.json({ error: "roomCode es requerido" }, { status: 400 });
  }

  const state = getState(roomCode);
  if (!state) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  }

  return NextResponse.json(state);
}
