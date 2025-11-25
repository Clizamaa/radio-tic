import { NextResponse } from "next/server";
import { addRequest } from "@/lib/queueStore";

export async function POST(req) {
  const body = await req.json();
  const { nickname, videoId, title, thumbnailUrl } = body || {};
  if (!nickname || !videoId) {
    return NextResponse.json(
      { error: "nickname y videoId son requeridos" },
      { status: 400 }
    );
  }
  const state = addRequest({ nickname, videoId, title, thumbnailUrl });
  return NextResponse.json(state);
}

