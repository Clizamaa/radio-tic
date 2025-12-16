import { NextResponse } from "next/server";
import { getAllRooms, deleteRoomAdmin, getRoomState } from "@/lib/queueStore";

export async function GET() {
  const rooms = getAllRooms();
  return NextResponse.json({ rooms });
}

export async function DELETE(req) {
  const body = await req.json();
  const { roomCode } = body;
  
  if (!roomCode) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }
  
  const success = deleteRoomAdmin(roomCode);
  return NextResponse.json({ success });
}

// Endpoint para acciones de edición/moderación
export async function PUT(req) {
    const body = await req.json();
    const { roomCode, action } = body;

    const room = getRoomState(roomCode);
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    if (action === "clear_queue") {
        room.queue = [];
        return NextResponse.json({ success: true, message: "Cola limpiada" });
    }
    
    if (action === "skip_current") {
        // Lógica simplificada de skip sin advance completo (solo anula nowPlaying)
        // Idealmente usaríamos advance() pero importarlo requiere cuidado con dependencias circulares si no está bien separado.
        // Usaremos el helper si es posible o modificamos estado directo con cuidado.
        // Por seguridad, mejor solo limpiar cola por ahora.
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}