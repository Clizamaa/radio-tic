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
  const [searchError, setSearchError] = useState(null);
  const [queue, setQueue] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const playerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const currentVidRef = useRef(null);
  const [playerState, setPlayerState] = useState("idle");
  const [requestingId, setRequestingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [savedNickname, setSavedNickname] = useState("");
  const [editingNickname, setEditingNickname] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  // Último video solicitado (cola tail) o el actualmente reproduciéndose si la cola está vacía
  const lastRequestedVideoId = queue.length > 0 ? queue[queue.length - 1]?.videoId : nowPlaying?.videoId;

  useEffect(() => {
    const saved = localStorage.getItem("radio_nickname") || "";
    setNickname(saved);
    setSavedNickname(saved);
    refreshState();
    loadYouTubeApi();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      refreshState();
    }, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const vid = nowPlaying?.videoId;
    if (!playerRef.current || !vid) return;
    if (currentVidRef.current === vid) return;
    try {
      playerRef.current.loadVideoById(vid);
      currentVidRef.current = vid;
      const t0 = typeof startedAt === "number" ? startedAt : null;
      if (t0) {
        const elapsed = Math.max(0, Math.floor((Date.now() - t0) / 1000));
        try {
          playerRef.current.playVideo();
          playerRef.current.seekTo(elapsed, true);
        } catch {}
      }
    } catch {}
  }, [nowPlaying?.videoId, startedAt]);

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
      if (Object.prototype.hasOwnProperty.call(data, "queue")) {
        setQueue(data.queue);
      }
      if (Object.prototype.hasOwnProperty.call(data, "nowPlaying")) {
        if (data.nowPlaying) {
          setNowPlaying(data.nowPlaying);
        } else {
          // Evitar borrar la tarjeta si el reproductor está reproduciendo
          if (playerState !== "playing") {
            setNowPlaying(null);
            // Permitir que un futuro cambio vuelva a cargar correctamente
            currentVidRef.current = null;
          }
        }
      }
      if (Object.prototype.hasOwnProperty.call(data, "startedAt")) {
        if (typeof data.startedAt === "number") {
          setStartedAt(data.startedAt);
        } else {
          if (playerState !== "playing") {
            setStartedAt(null);
          }
        }
      }
    }
  }

  async function search() {
    if (!query.trim()) return;
    setSearchError(null);
    setResults([]);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "Error al buscar en YouTube";
        setSearchError(msg);
        return;
      }
      setResults(data.results || []);
      // Limpiar el input al completar la búsqueda correctamente
      setQuery("");
    } catch (err) {
      setSearchError("No se pudo conectar al servidor de búsqueda");
    }
  }

  async function request(video) {
    if (!nickname.trim()) {
      alert("Primero registra un nickname");
      return;
    }
    // Evitar doble click inmediato sobre la misma tarjeta
    if (requestingId === video.videoId) return;
    setRequestingId(video.videoId);
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
      if (Object.prototype.hasOwnProperty.call(data, "queue")) {
        setQueue(data.queue);
      }
      if (Object.prototype.hasOwnProperty.call(data, "nowPlaying")) {
        setNowPlaying(data.nowPlaying);
      }
      if (Object.prototype.hasOwnProperty.call(data, "startedAt")) {
        setStartedAt(data.startedAt);
      }
    }
    setRequestingId(null);
  }

  async function removeQueued(id) {
    setDeletingId(id);
    const res = await fetch("/api/queue/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Object.prototype.hasOwnProperty.call(data, "queue")) setQueue(data.queue);
      if (Object.prototype.hasOwnProperty.call(data, "nowPlaying")) setNowPlaying(data.nowPlaying);
      if (Object.prototype.hasOwnProperty.call(data, "startedAt")) setStartedAt(data.startedAt);
    }
    setDeletingId(null);
  }

  function computeReorderIds(dragId, targetId) {
    const ids = queue.map((i) => i.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return ids;
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    return ids;
  }

  async function applyReorder(order) {
    const res = await fetch("/api/queue/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Object.prototype.hasOwnProperty.call(data, "queue")) setQueue(data.queue);
      if (Object.prototype.hasOwnProperty.call(data, "nowPlaying")) setNowPlaying(data.nowPlaying);
      if (Object.prototype.hasOwnProperty.call(data, "startedAt")) setStartedAt(data.startedAt);
    }
  }

  async function advanceQueue() {
    const res = await fetch("/api/queue/advance", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (Object.prototype.hasOwnProperty.call(data, "queue")) {
        setQueue(data.queue);
      }
      if (Object.prototype.hasOwnProperty.call(data, "nowPlaying")) {
        setNowPlaying(data.nowPlaying);
      }
      if (Object.prototype.hasOwnProperty.call(data, "startedAt")) {
        setStartedAt(data.startedAt);
      }
    }
  }

  async function previousQueue() {
    const res = await fetch("/api/queue/previous", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (Object.prototype.hasOwnProperty.call(data, "queue")) {
        setQueue(data.queue);
      }
      if (Object.prototype.hasOwnProperty.call(data, "nowPlaying")) {
        setNowPlaying(data.nowPlaying);
      }
      if (Object.prototype.hasOwnProperty.call(data, "startedAt")) {
        setStartedAt(data.startedAt);
      }
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
    const val = nickname.trim();
    if (!val) return;
    localStorage.setItem("radio_nickname", val);
    setNickname(val);
    setSavedNickname(val);
    setEditingNickname(false);
  }

  function startNicknameEdit() {
    setEditingNickname(true);
    setNickname(savedNickname || "");
  }

  function cancelNicknameEdit() {
    setEditingNickname(false);
    setNickname(savedNickname || "");
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <main className="max-w-auto px-8 py-10">
        <h1 className="text-3xl font-semibold">Radio TIC</h1>
        <p className="mt-1 text-sm opacity-70">Solicita canciones y colócalas en cola. Reproducción solo audio.</p>

        {/* Layout principal: dos columnas */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          {/* Izquierda: Peticiones (nickname, búsqueda y resultados) */}
          <div className="lg:basis-[50%] lg:flex-none">
            <div className="mx-auto w-full lg:w-1/2">
              <h2 className="text-xl font-semibold">Peticiones</h2>
              <div className="mt-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
                <label className="block text-sm font-medium">Tu nickname</label>
                {savedNickname && !editingNickname ? (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm font-medium">Bienvenido {savedNickname}</div>
                    <button
                      onClick={startNicknameEdit}
                      className="rounded-md bg-zinc-200 px-3 py-2 text-xs text-black dark:bg-zinc-800 dark:text-white"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
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
                    {savedNickname ? (
                      <button
                        onClick={cancelNicknameEdit}
                        className="rounded-md bg-zinc-200 px-3 py-2 text-sm text-black dark:bg-zinc-800 dark:text-white"
                      >
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                )}

                <label className="mt-4 block text-sm font-medium">Buscar en YouTube</label>
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
                {searchError && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {searchError}
                  </div>
                )}
              </div>

              <h3 className="mt-6 text-lg font-semibold">Resultados</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((r) => (
                  <div key={r.videoId} className="w-full h-full flex flex-col rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                    <div className="relative w-full overflow-hidden rounded" style={{ aspectRatio: "16/9" }}>
                      <img src={r.thumbnailUrl} alt="thumb" className="absolute inset-0 h-full w-full object-cover" />
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-medium">{r.title}</div>
                      <div className="text-xs opacity-60">{r.channel}</div>
                    </div>
                    <div className="mt-auto pt-2">
                      {(() => {
                        const isBlocked = r.videoId === lastRequestedVideoId;
                        const isLoading = requestingId === r.videoId;
                        const disabled = isBlocked || isLoading;
                        const label = isBlocked ? "En cola" : isLoading ? "Solicitando..." : "Solicitar";
                        return (
                          <button
                            onClick={() => request(r)}
                            disabled={disabled}
                            className={`w-full rounded-md px-3 py-2 text-sm text-white ${disabled ? "bg-green-600 opacity-50 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
                            title={label}
                            aria-label={label}
                          >
                            {label}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Derecha: Reproductor y Cola */}
          <div className="lg:basis-[50%] lg:flex-none">
            <div className="mx-left w-full lg:w-1/2">
            <h2 className="text-xl font-semibold">En reproducción</h2>
            <div className="mt-3 rounded-md p-4 border-beam">
              {nowPlaying ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={nowPlaying.thumbnailUrl} alt="carátula" className="h-16 w-28 rounded object-cover" />
                    <div className="flex-1">
                      <div className="text-base font-semibold">{nowPlaying.title}</div>
                      <div className="text-xs opacity-60">Solicitado por {nowPlaying.nickname}</div>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                    playerState === "playing"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : playerState === "paused"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                      : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                  }`}>
                    {playerState === "playing" ? <IconPlay className="h-3 w-3" /> : playerState === "paused" ? <IconPause className="h-3 w-3" /> : <IconPause className="h-3 w-3" />}
                    {playerState === "playing" ? "Reproduciendo" : playerState === "paused" ? "Pausado" : "Detenido"}
                  </div>
                  <div className="mt-3 flex gap-3">
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
                </div>
              ) : (
                <div className="text-sm opacity-60">No hay canción en reproducción</div>
              )}
              <div id="player" className="h-0 w-0 overflow-hidden"></div>
            </div>

            <h2 className="mt-6 text-xl font-semibold">Cola</h2>
            <div className="mt-3 space-y-2">
              {queue.length === 0 && <div className="text-sm opacity-60">No hay canciones en cola</div>}
              {queue.map((q) => (
                <div
                  key={q.id}
                  className={`flex items-center gap-3 rounded-md border p-3 transition-all duration-200 ease-in-out ${dragOverId === q.id ? "border-blue-500 ring-4 ring-blue-400 bg-blue-100/50 translate-y-1 translate-x-1" : "border-zinc-200 dark:border-zinc-800"} ${draggingId === q.id ? "scale-90 opacity-90 shadow-lg bg-blue-50/40 ring-2 ring-blue-300" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggingId && draggingId !== q.id) setDragOverId(q.id);
                  }}
                  onDrop={async () => {
                    if (!draggingId || draggingId === q.id) {
                      setDragOverId(null);
                      setDraggingId(null);
                      return;
                    }
                    const order = computeReorderIds(draggingId, q.id);
                    await applyReorder(order);
                    setDragOverId(null);
                    setDraggingId(null);
                  }}
                  onDragLeave={() => {
                    // Suavizar salida del resaltado al dejar el item
                    if (dragOverId === q.id) setDragOverId(null);
                  }}
                >
                  <button
                    className={`inline-flex items-center justify-center rounded-md px-3 py-3 text-sm cursor-grab active:cursor-grabbing transition-transform duration-200 ${draggingId === q.id ? "scale-125 text-blue-700 drop-shadow-sm" : "text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
                    draggable
                    onDragStart={() => setDraggingId(q.id)}
                    onDragEnd={() => {
                      setDragOverId(null);
                      setDraggingId(null);
                    }}
                    title="Arrastrar para reordenar"
                    aria-label="Arrastrar para reordenar"
                  >
                    <span aria-hidden="true">☰</span>
                  </button>
                  <img src={q.thumbnailUrl} alt="thumb" className="h-12 w-20 rounded object-cover" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{q.title}</div>
                    <div className="text-xs opacity-60">{q.nickname}</div>
                  </div>
                  <button
                    onClick={() => removeQueued(q.id)}
                    disabled={deletingId === q.id}
                    className={`rounded-md bg-red-600 px-3 py-2 text-xs text-white ${deletingId === q.id ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700"}`}
                    title={deletingId === q.id ? "Eliminando..." : "Eliminar"}
                    aria-label={deletingId === q.id ? "Eliminando..." : "Eliminar"}
                  >
                    {deletingId === q.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              ))}
            </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
