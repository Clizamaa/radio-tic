import { NextResponse } from "next/server";
import { deleteRoom } from "@/lib/queueStore";

export async function POST(req) {
  try {
    const body = await req.json();
    const { roomCode, adminToken } = body;

    if (!roomCode || !adminToken) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const success = deleteRoom(roomCode, adminToken);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "No autorizado o sala no existe" }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
