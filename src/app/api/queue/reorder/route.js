import { NextResponse } from "next/server";
import { reorderQueue } from "@/lib/queueStore";

export async function POST(req) {
  const body = await req.json();
  const order = body?.order;
  if (!Array.isArray(order)) {
    return NextResponse.json({ error: "order debe ser un arreglo de ids" }, { status: 400 });
  }
  const state = reorderQueue(order);
  return NextResponse.json(state);
}