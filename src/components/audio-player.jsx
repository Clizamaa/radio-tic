"use client"

export function AudioPlayer({
  title,
  artist,
  cover,
  duration = 0,
  currentTime = 0,
  isPlaying = false,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  volume = 100,
  onVolumeChange,
  isMuted = false,
  onToggleMute,
}) {
  const formatTime = (seconds) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const decodeHtml = (html) => {
    if (!html) return "";
    return html.replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"');
  };

  return (
    <div className="w-full">
      <div className="rounded-3xl overflow-hidden bg-white/5 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200/10 dark:border-zinc-800/50 shadow-xl">
        <div className="flex flex-col md:flex-row lg:flex-col items-center md:items-stretch lg:items-center">
          <div className="relative w-1/2 aspect-square mt-6 rounded-2xl shadow-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 md:w-32 md:m-6 md:shadow-md lg:w-1/2 lg:mt-6 lg:mx-auto lg:shadow-lg transition-all">
            <img src={cover || "/placeholder.svg"} alt={title || "cover"} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
          </div>
          <div className="flex-1 p-6 flex flex-col justify-center space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl lg:text-xl xl:text-2xl font-bold break-words leading-tight text-zinc-900 dark:text-white">{decodeHtml(title) || "Sin título"}</h2>
              {artist && <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Solicitado por <span className="text-violet-500 dark:text-violet-400">{artist}</span></p>}
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={Math.max(1, Math.floor(duration))}
                step={1}
                value={Math.floor(currentTime) || 0}
                onChange={(e) => onSeek && onSeek(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-600"
              />
              <div className="flex justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button aria-label="Anterior" className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-colors" onClick={onPrev}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M19 12H7" />
                    <path d="M12 19L5 12L12 5" />
                  </svg>
                </button>
                <button aria-label="Play/Pausa" className="h-12 w-12 inline-flex items-center justify-center rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20 transition-all hover:scale-105" onClick={onPlayPause}>
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 ml-1">
                      <path d="M8 5L19 12L8 19Z" />
                    </svg>
                  )}
                </button>
                <button aria-label="Siguiente" className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-colors" onClick={onNext}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M5 12H17" />
                    <path d="M12 5L19 12L12 19" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2 w-32">
                <button aria-label="Mute" className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400" onClick={onToggleMute}>
                  {isMuted || volume === 0 ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M11 5L6 9H3v6h3l5 4V5z" />
                      <path d="M23 9l-6 6" />
                      <path d="M17 9l6 6" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M11 5L6 9H3v6h3l5 4V5z" />
                      <path d="M19 12a4 4 0 0 0 4-4" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={volume}
                  onChange={(e) => onVolumeChange && onVolumeChange(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-400 dark:[&::-webkit-slider-thumb]:bg-zinc-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
