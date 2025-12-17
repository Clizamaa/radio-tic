import { NextResponse } from "next/server";
import { addRequest } from "@/lib/queueStore";

export async function POST(req) {
  const body = await req.json();
  const { nickname, videoId, title, thumbnailUrl, roomCode } = body || {};
  
  if (!roomCode) {
    return NextResponse.json({ error: "roomCode es requerido" }, { status: 400 });
  }
  if (!nickname || !videoId) {
    return NextResponse.json(
      { error: "nickname y videoId son requeridos" },
      { status: 400 }
    );
  }

  const state = addRequest(roomCode, { nickname, videoId, title, thumbnailUrl });
  if (!state) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  }
  if (state.error) {
    return NextResponse.json({ error: state.error }, { status: 400 });
  }
  return NextResponse.json(state);
}
