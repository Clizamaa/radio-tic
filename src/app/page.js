"use client";

import { useEffect, useRef, useState } from "react";

function IconPrev(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "h-5 w-5"} aria-hidden="true">
      <path d="M19 12H7" />
      <path d="M12 19L5 12L12 5" />
    </svg>
  );
}

function IconNext(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "h-5 w-5"} aria-hidden="true">
      <path d="M5 12H17" />
      <path d="M12 5L19 12L12 19" />
    </svg>
  );
}

function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className || "h-5 w-5"} aria-hidden="true">
      <path d="M8 5L19 12L8 19Z" />
    </svg>
  );
}

function IconPause(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className || "h-5 w-5"} aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export default function Home() {
  const [nickname, setNickname] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [queue, setQueue] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const playerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const [playerState, setPlayerState] = useState("idle");

  useEffect(() => {
    const saved = localStorage.getItem("radio_nickname") || "";
    setNickname(saved);
    refreshState();
    loadYouTubeApi();
  }, []);

  useEffect(() => {
    if (playerRef.current && nowPlaying?.videoId) {
      try {
        playerRef.current.loadVideoById(nowPlaying.videoId);
      } catch {}
    }
  }, [nowPlaying]);

  function loadYouTubeApi() {
    if (typeof window === "undefined") return;
    if (ytReadyRef.current) return;
    const existing = document.querySelector("script[src='https://www.youtube.com/iframe_api']");
    if (!existing) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
    window.onYouTubeIframeAPIReady = () => {
      ytReadyRef.current = true;
      playerRef.current = new window.YT.Player("player", {
        height: "0",
        width: "0",
        events: {
          onStateChange: (e) => {
            const YTPS = window.YT?.PlayerState;
            if (!YTPS) return;
            if (e.data === YTPS.PLAYING) setPlayerState("playing");
            else if (e.data === YTPS.PAUSED) setPlayerState("paused");
            else if (e.data === YTPS.ENDED) {
              setPlayerState("ended");
              advanceQueue();
            } else if (e.data === YTPS.CUED) setPlayerState("idle");
          },
        },
        playerVars: { controls: 0 },
      });
    };
  }

  async function refreshState() {
    const res = await fetch("/api/queue");
    if (res.ok) {
      const data = await res.json();
      setQueue(data.queue || []);
      setNowPlaying(data.nowPlaying || null);
    }
  }

  async function search() {
    if (!query.trim()) return;
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results || []);
  }

  async function request(video) {
    if (!nickname.trim()) {
      alert("Primero registra un nickname");
      return;
    }
    const res = await fetch("/api/queue/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname,
        videoId: video.videoId,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setQueue(data.queue || []);
      setNowPlaying(data.nowPlaying || null);
    }
  }

  async function advanceQueue() {
    const res = await fetch("/api/queue/advance", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setQueue(data.queue || []);
      setNowPlaying(data.nowPlaying || null);
    }
  }

  async function previousQueue() {
    const res = await fetch("/api/queue/previous", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setQueue(data.queue || []);
      setNowPlaying(data.nowPlaying || null);
    }
  }

  function togglePlayPause() {
    const ps = window.YT?.PlayerState;
    const player = playerRef.current;
    if (!player || !ps || !player.getPlayerState) return;
    const state = player.getPlayerState();
    if (state === ps.PLAYING) player.pauseVideo();
    else player.playVideo();
  }

  function saveNickname() {
    localStorage.setItem("radio_nickname", nickname.trim());
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Radio TIC</h1>
        <p className="mt-1 text-sm opacity-70">Solicita canciones y colócalas en cola. Reproducción solo audio.</p>

        <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium">Tu nickname</label>
            <div className="mt-2 flex gap-2">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="ej. Juanito"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                onClick={saveNickname}
                className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-200 dark:text-black"
              >
                Guardar
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Buscar en YouTube</label>
            <div className="mt-2 flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nombre de la canción o artista"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                onClick={search}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white"
              >
                Buscar
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Resultados</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {results.map((r) => (
              <div key={r.videoId} className="flex items-center gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                <img src={r.thumbnailUrl} alt="thumb" className="h-14 w-24 rounded object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="text-xs opacity-60">{r.channel}</div>
                </div>
                <button onClick={() => request(r)} className="rounded-md bg-green-600 px-3 py-2 text-sm text-white">
                  Solicitar
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">En reproducción</h2>
            <div className="mt-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              {nowPlaying ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">{nowPlaying.title}</div>
                  <div className="text-xs opacity-60">Solicitado por {nowPlaying.nickname}</div>
                  <div className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                    playerState === "playing"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : playerState === "paused"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                      : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                  }`}>
                    {playerState === "playing" ? <IconPlay className="h-3 w-3" /> : playerState === "paused" ? <IconPause className="h-3 w-3" /> : <IconPause className="h-3 w-3" />}
                    {playerState === "playing" ? "Reproduciendo" : playerState === "paused" ? "Pausado" : "Detenido"}
                  </div>
                </div>
              ) : (
                <div className="text-sm opacity-60">No hay canción en reproducción</div>
              )}
              <div id="player" className="h-0 w-0 overflow-hidden"></div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Cola</h2>
            <div className="mt-3 space-y-2">
              {queue.length === 0 && <div className="text-sm opacity-60">No hay canciones en cola</div>}
              {queue.map((q) => (
                <div key={q.id} className="flex items-center gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                  <img src={q.thumbnailUrl} alt="thumb" className="h-12 w-20 rounded object-cover" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{q.title}</div>
                    <div className="text-xs opacity-60">{q.nickname}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8 flex gap-3">
          <button aria-label="Anterior" title="Anterior" onClick={previousQueue} className="inline-flex items-center justify-center rounded-md bg-zinc-200 px-3 py-2 text-black dark:bg-zinc-800 dark:text-white">
            <IconPrev className="h-5 w-5" />
          </button>
          <button aria-label="Play/Pausa" title="Play/Pausa" onClick={togglePlayPause} className="inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-white">
            {playerState === "playing" ? <IconPause className="h-5 w-5" /> : <IconPlay className="h-5 w-5" />}
          </button>
          <button aria-label="Siguiente" title="Siguiente" onClick={advanceQueue} className="inline-flex items-center justify-center rounded-md bg-orange-600 px-3 py-2 text-white">
            <IconNext className="h-5 w-5" />
          </button>
        </div>
      </main>
    </div>
  );
}
