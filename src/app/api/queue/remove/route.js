import { NextResponse } from "next/server";
import { removeFromQueue } from "@/lib/queueStore";

export async function POST(req) {
  const body = await req.json();
  const { id, roomCode } = body || {};
  
  if (!roomCode) {
    return NextResponse.json({ error: "roomCode es requerido" }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json(
      { error: "id es requerido" },
      { status: 400 }
    );
  }

  const state = removeFromQueue(roomCode, id);
  if (!state) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  }
  return NextResponse.json(state);
}
