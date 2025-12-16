import { NextResponse } from "next/server";
import { reorderQueue } from "@/lib/queueStore";

export async function POST(req) {
  const body = await req.json();
  const { order, roomCode } = body || {};
  
  if (!roomCode) {
    return NextResponse.json({ error: "roomCode es requerido" }, { status: 400 });
  }
  if (!Array.isArray(order)) {
    return NextResponse.json({ error: "order debe ser un arreglo de ids" }, { status: 400 });
  }

  const state = reorderQueue(roomCode, order);
  if (!state) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  }
  return NextResponse.json(state);
}
