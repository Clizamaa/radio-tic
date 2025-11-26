import { NextResponse } from "next/server";

export async function GET(req) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!q.trim()) {
    return NextResponse.json({ error: "Falta parámetro q" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json(
      { error: "Configura YOUTUBE_API_KEY en el entorno" },
      { status: 500 }
    );
  }

  const endpoint = new URL("https://www.googleapis.com/youtube/v3/search");
  endpoint.searchParams.set("part", "snippet");
  endpoint.searchParams.set("type", "video");
  endpoint.searchParams.set("maxResults", "10");
  endpoint.searchParams.set("q", q);
  endpoint.searchParams.set("key", apiKey);

  const res = await fetch(endpoint.toString());
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "Error al consultar YouTube", details: text },
      { status: 502 }
    );
  }
  const data = await res.json();
  const items = (data.items || [])
    .filter((item) => item?.id?.videoId)
    .map((item) => {
      const vid = item.id?.videoId;
      const sn = item.snippet || {};
      const thumbs = sn.thumbnails || {};
      const thumb = thumbs.medium?.url || thumbs.default?.url || "";
      return {
        videoId: vid,
        title: sn.title,
        channel: sn.channelTitle,
        thumbnailUrl: thumb,
      };
    });
  return NextResponse.json({ results: items });
}

