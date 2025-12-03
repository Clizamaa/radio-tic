import { NextResponse } from "next/server";
import { removeFromQueue } from "@/lib/queueStore";

export async function POST(req) {
  const body = await req.json();
  const { id } = body || {};
  if (!id) {
    return NextResponse.json(
      { error: "id es requerido" },
      { status: 400 }
    );
  }
  const state = removeFromQueue(id);
  return NextResponse.json(state);
}