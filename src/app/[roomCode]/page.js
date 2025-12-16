"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AudioPlayer } from "@/components/audio-player";

export default function Room() {
  const params = useParams();
  const roomCode = params?.roomCode;
  const router = useRouter();
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
  const [ytTime, setYtTime] = useState(0);
  const [ytDur, setYtDur] = useState(0);
  const [ytVol, setYtVol] = useState(100);
  const [ytMuted, setYtMuted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const [playError, setPlayError] = useState(null);

  // Último video solicitado (cola tail) o el actualmente reproduciéndose si la cola está vacía
  const lastRequestedVideoId = queue.length > 0 ? queue[queue.length - 1]?.videoId : nowPlaying?.videoId;

  useEffect(() => {
    // Si hay música sonando pero el player no está reproduciendo después de un tiempo, pedir interacción
    if (nowPlaying && playerState !== "playing") {
      const timer = setTimeout(() => {
        if (playerState !== "playing") {
          setNeedsInteraction(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setNeedsInteraction(false);
    }
  }, [nowPlaying, playerState]);

  useEffect(() => {
    const saved = localStorage.getItem("radio_nickname") || "";
    setNickname(saved);
    setSavedNickname(saved);
    
    // Check for admin token
    if (roomCode) {
      const token = localStorage.getItem(`radio_admin_${roomCode}`);
      if (token) setIsAdmin(true);
    }

    loadYouTubeApi();
    return () => {
      const p = playerRef.current;
      if (p && p.__poll) {
        clearInterval(p.__poll);
      }
      try {
        p?.destroy?.();
      } catch {}
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (roomCode) refreshState();
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode) return;
    const id = setInterval(() => {
      refreshState();
    }, 10000);
    return () => clearInterval(id);
  }, [roomCode]);

  useEffect(() => {
    const vid = nowPlaying?.videoId;
    if (!playerRef.current || !vid) return;
    if (currentVidRef.current === vid) return;
    try {
      const t0 = typeof startedAt === "number" ? startedAt : null;
      const elapsed = t0 ? Math.max(0, Math.floor((Date.now() - t0) / 1000)) : 0;
      
      playerRef.current.loadVideoById({
        videoId: vid,
        startSeconds: elapsed
      });
      currentVidRef.current = vid;
      
      // Intentar reproducir explícitamente por si acaso
      setTimeout(() => {
        try {
          playerRef.current?.playVideo();
        } catch {}
      }, 100);
    } catch {}
  }, [nowPlaying?.videoId, startedAt]);

  function loadYouTubeApi() {
    if (typeof window === "undefined") return;
    if (ytReadyRef.current) return;

    const initPlayer = () => {
        let el = document.getElementById("yt-audio-container");
        if (!el) {
          el = document.createElement("div");
          el.id = "yt-audio-container";
          // YouTube requiere un tamaño mínimo para evitar bloqueos de "reproducción oculta"
          // Usamos un tamaño de 200x200 (mínimo seguro) pero lo hacemos invisible con opacidad
          el.style.cssText = "position:fixed;bottom:0;right:0;width:200px;height:200px;opacity:0.001;z-index:-10;pointer-events:none;";
          document.body.appendChild(el);
        }
        try {
          // Aseguramos que el origen esté limpio (sin slash final a veces ayuda)
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          
          playerRef.current = new window.YT.Player("yt-audio-container", {
            height: "200",
            width: "200",
            videoId: nowPlaying?.videoId || "", // Cargar ID inicial si existe
            events: {
              onStateChange: (e) => {
                const YTPS = window.YT?.PlayerState;
                if (!YTPS) return;
                if (e.data === YTPS.PLAYING) setPlayerState("playing");
                else if (e.data === YTPS.PAUSED) setPlayerState("paused");
                else if (e.data === YTPS.ENDED) {
                  setPlayerState("ended");
                  advanceQueue();
                } else if (e.data === YTPS.CUED) {
                   setPlayerState("idle");
                   // Si está en 'cued' y tenemos video, intentar reproducir
                   if (nowPlaying?.videoId) {
                     playerRef.current?.playVideo();
                   }
                }
              },
              onError: (e) => {
                console.error("YT Error:", e.data);
                // 150: Restricción de embed. 100: Video no encontrado. 101: No permitido en embed.
                if (e.data === 150 || e.data === 101 || e.data === 100) {
                    setPlayError(`Error ${e.data}: Video restringido por YouTube. Saltando...`);
                    // Pequeño delay para evitar loops instantáneos
                    setTimeout(() => {
                        setPlayError(null);
                        advanceQueue();
                    }, 2000);
                }
              },
              onReady: (e) => {
                ytReadyRef.current = true;
                if (nowPlaying?.videoId) {
                   const t0 = typeof startedAt === "number" ? startedAt : null;
                   const elapsed = t0 ? Math.max(0, Math.floor((Date.now() - t0) / 1000)) : 0;
                   // Si el video ya se cargó por constructor, solo seek y play
                   if (e.target.getVideoData && e.target.getVideoData().video_id === nowPlaying.videoId) {
                       e.target.seekTo(elapsed);
                   } else {
                       e.target.loadVideoById({
                          videoId: nowPlaying.videoId,
                          startSeconds: elapsed
                       });
                   }
                   e.target.setVolume(100);
                   e.target.unMute();
                   e.target.playVideo();
                   currentVidRef.current = nowPlaying.videoId;
                }
              }
            },
            playerVars: { 
              controls: 0,
              autoplay: 1, // Autoplay habilitado
              playsinline: 1,
              origin: origin,
              enablejsapi: 1,
              rel: 0,
              disablekb: 1,
              fs: 0,
              iv_load_policy: 3
            },
          });
          const id = setInterval(() => {
            const p = playerRef.current;
            if (p && p.getCurrentTime) {
              try {
                setYtTime(p.getCurrentTime() || 0);
                setYtDur(p.getDuration() || 0);
                setYtVol(p.getVolume?.() ?? ytVol);
                setYtMuted(p.isMuted?.() ?? ytMuted);
              } catch {}
            }
          }, 500);
          playerRef.current.__poll = id;
        } catch {
          setTimeout(initPlayer, 50);
        }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const existing = document.querySelector("script[src='https://www.youtube.com/iframe_api']");
    if (!existing) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
    window.onYouTubeIframeAPIReady = initPlayer;
  }

  async function refreshState() {
    if (!roomCode) return;
    const res = await fetch(`/api/queue?roomCode=${roomCode}`);
    if (res.status === 404) {
      router.push("/?error=room_not_found");
      return;
    }
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
        roomCode,
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
      body: JSON.stringify({ id, roomCode }),
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
      body: JSON.stringify({ order, roomCode }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Object.prototype.hasOwnProperty.call(data, "queue")) setQueue(data.queue);
      if (Object.prototype.hasOwnProperty.call(data, "nowPlaying")) setNowPlaying(data.nowPlaying);
      if (Object.prototype.hasOwnProperty.call(data, "startedAt")) setStartedAt(data.startedAt);
    }
  }

  async function advanceQueue() {
    const res = await fetch("/api/queue/advance", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode })
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
  }

  async function previousQueue() {
    const res = await fetch("/api/queue/previous", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode })
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

  async function closeRoom() {
    if (!confirm("¿Estás seguro de que deseas cerrar la sala? Todos los usuarios serán desconectados.")) {
      return;
    }

    const token = localStorage.getItem(`radio_admin_${roomCode}`);
    if (!token) return;

    try {
      const res = await fetch("/api/room/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, adminToken: token }),
      });

      if (res.ok) {
        localStorage.removeItem(`radio_admin_${roomCode}`);
        router.push("/");
      } else {
        alert("Error al cerrar la sala");
      }
    } catch (err) {
      alert("Error de conexión");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100 font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-100 via-zinc-50 to-zinc-50 dark:from-zinc-900 dark:via-black dark:to-black -z-10 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-black/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/20">
                R
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden sm:block">Radio ShiarshaSoft</h1>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Sala</span>
              <code className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">{roomCode}</code>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Mobile Room Code (only visible on small screens) */}
             <div className="sm:hidden flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <code className="text-sm font-mono font-bold">{roomCode}</code>
            </div>

            {isAdmin && (
              <button 
                onClick={closeRoom}
                className="inline-flex items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-4 py-1.5 text-sm font-medium transition-colors border border-red-500/20"
              >
                Cerrar Sala
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Autoplay Blocker Overlay */}
      {needsInteraction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-4 border border-zinc-200 dark:border-zinc-800">
            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto text-violet-600 dark:text-violet-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Activar Audio</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                El navegador ha bloqueado la reproducción automática. Haz clic abajo para escuchar la radio.
              </p>
            </div>
            <button
              onClick={() => {
                // Si el player no existe, intentar reinicializar
                if (!playerRef.current) {
                  ytReadyRef.current = false;
                  loadYouTubeApi();
                  // No cerramos el overlay aún, esperamos a que cargue
                  return;
                }
                
                const p = playerRef.current;
                // Si el player existe, asegurar que tenga el video correcto
                if (nowPlaying?.videoId && p.loadVideoById) {
                    try {
                        // Forzamos la carga del video actual para asegurar reproducción
                        const t0 = typeof startedAt === "number" ? startedAt : null;
                        const elapsed = t0 ? Math.max(0, Math.floor((Date.now() - t0) / 1000)) : 0;
                        p.loadVideoById({
                            videoId: nowPlaying.videoId,
                            startSeconds: elapsed
                        });
                        currentVidRef.current = nowPlaying.videoId;
                    } catch {}
                }

                if (p && p.playVideo) {
                  // Asegurar volumen y audio activado
                  if (p.unMute) p.unMute();
                  if (p.setVolume) p.setVolume(100);
                  
                  p.playVideo();
                  setNeedsInteraction(false);
                }
              }}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-500/20 transition-all transform hover:scale-[1.02]"
            >
              Comenzar a Escuchar
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Notificación de Error de Reproducción */}
        {playError && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
            <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border border-red-400/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-sm">{playError}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Search & Discovery */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Nickname & Search Section */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold">Peticiones</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Busca y añade canciones a la cola</p>
                  </div>
                  
                  {/* Nickname Control */}
                  <div className="w-full sm:w-auto">
                    {savedNickname && !editingNickname ? (
                      <button
                        onClick={startNicknameEdit}
                        className="w-full sm:w-auto group flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-violet-500/50 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium">{savedNickname}</span>
                        </div>
                        <span className="text-xs text-zinc-400 group-hover:text-violet-500">Editar</span>
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="Tu Nickname..."
                          className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                        />
                        <button
                          onClick={saveNickname}
                          className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          {savedNickname ? "Ok" : "Entrar"}
                        </button>
                        {savedNickname && (
                          <button onClick={cancelNicknameEdit} className="px-3 py-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">✕</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && search()}
                    placeholder="Buscar canción o artista en YouTube..."
                    className="w-full pl-10 pr-24 py-4 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                  <div className="absolute inset-y-2 right-2">
                    <button
                      onClick={search}
                      className="h-full px-6 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-violet-600/20"
                    >
                      Buscar
                    </button>
                  </div>
                </div>
                {searchError && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {searchError}
                  </p>
                )}
              </div>

              {/* Results Grid */}
              {results.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4 px-1">Resultados</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.map((r) => {
                       const isBlocked = r.videoId === lastRequestedVideoId;
                       const isLoading = requestingId === r.videoId;
                       const disabled = isBlocked || isLoading;
                       
                       return (
                        <div key={r.videoId} className="group relative bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 hover:shadow-xl transition-all duration-300">
                          <div className="aspect-video relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                            <img src={r.thumbnailUrl} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            
                            {/* Overlay Button */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <button
                                onClick={() => request(r)}
                                disabled={disabled}
                                className={`transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 px-6 py-2 rounded-full font-medium text-sm shadow-lg ${disabled ? "bg-zinc-500 text-white cursor-not-allowed" : "bg-white text-black hover:bg-zinc-100"}`}
                               >
                                 {isBlocked ? "En cola" : isLoading ? "..." : "Solicitar"}
                               </button>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold text-sm line-clamp-1" title={r.title}>{r.title}</h4>
                            <p className="text-xs text-zinc-500 mt-1">{r.channel}</p>
                            
                            {/* Mobile only button (visible when not hovering on touch devices usually, but simplified here) */}
                            <div className="mt-3 sm:hidden">
                               <button
                                onClick={() => request(r)}
                                disabled={disabled}
                                className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 text-xs font-medium rounded-lg"
                               >
                                 {isBlocked ? "En cola" : isLoading ? "Solicitando..." : "Solicitar"}
                               </button>
                            </div>
                          </div>
                        </div>
                       );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Player & Queue */}
          <div className="lg:col-span-5 space-y-8">
            <div className="sticky top-24 space-y-8">
              
              {/* Now Playing */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold px-1">En reproducción</h2>
                {nowPlaying ? (
                  <AudioPlayer
                    title={nowPlaying.title}
                    artist={nowPlaying.nickname}
                    cover={nowPlaying.thumbnailUrl}
                    duration={ytDur}
                    currentTime={ytTime}
                    isPlaying={playerState === "playing"}
                    onPlayPause={togglePlayPause}
                    onPrev={previousQueue}
                    onNext={advanceQueue}
                    onSeek={(s) => playerRef.current?.seekTo?.(s, true)}
                    volume={ytVol}
                    onVolumeChange={(v) => playerRef.current?.setVolume?.(v)}
                    isMuted={ytMuted}
                    onToggleMute={() => {
                      const p = playerRef.current;
                      if (!p) return;
                      if (p.isMuted?.()) p.unMute?.(); else p.mute?.();
                      setYtMuted(p.isMuted?.() ?? false);
                    }}
                  />
                ) : (
                  <div className="bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-8 text-center border border-dashed border-zinc-300 dark:border-zinc-700">
                    <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto flex items-center justify-center mb-4 text-zinc-400">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                    </div>
                    <p className="text-zinc-500 font-medium">Nada sonando</p>
                    <p className="text-xs text-zinc-400 mt-1">Busca y solicita una canción</p>
                  </div>
                )}
              </div>

              {/* Queue List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-lg font-bold">Cola de reproducción</h2>
                  <span className="text-xs font-medium px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500">{queue.length}</span>
                </div>
                
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm backdrop-blur-sm">
                  {queue.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-sm">
                      La cola está vacía. ¡Sé el primero en pedir algo!
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {queue.map((q, index) => (
                        <div
                          key={q.id}
                          draggable
                          onDragStart={() => setDraggingId(q.id)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (draggingId && draggingId !== q.id) setDragOverId(q.id);
                          }}
                          onDragLeave={() => { if (dragOverId === q.id) setDragOverId(null); }}
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
                          className={`
                            relative group p-3 flex items-center gap-3 transition-all duration-200
                            ${dragOverId === q.id ? "bg-violet-50 dark:bg-violet-900/20 z-10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}
                            ${draggingId === q.id ? "opacity-50 grayscale" : ""}
                          `}
                        >
                          {/* Number / Drag Handle */}
                          <div className="w-6 text-center">
                            <span className="text-xs font-mono text-zinc-400 group-hover:hidden">{index + 1}</span>
                            <button 
                              className="hidden group-hover:inline-flex text-zinc-400 hover:text-zinc-600 cursor-grab active:cursor-grabbing"
                              title="Arrastrar para reordenar"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                            </button>
                          </div>

                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-200">
                            <img src={q.thumbnailUrl} alt="thumb" className="w-full h-full object-cover" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">{q.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] uppercase tracking-wider text-zinc-400">Por</span>
                              <span className="text-xs text-violet-600 dark:text-violet-400 font-medium truncate">{q.nickname}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => removeQueued(q.id)}
                            disabled={deletingId === q.id}
                            className={`
                              p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
                              ${deletingId === q.id ? "animate-pulse" : "opacity-0 group-hover:opacity-100"}
                            `}
                            title="Eliminar de la cola"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
