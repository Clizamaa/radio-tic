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

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-28 md:h-28 aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
            <img src={cover || "/placeholder.svg"} alt={title || "cover"} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 p-3 md:p-4 flex flex-col justify-center space-y-3">
            <div className="space-y-1">
              <h2 className="text-lg md:text-xl font-semibold break-words">{title || "Sin título"}</h2>
              {artist && <p className="text-[11px] opacity-70">{artist}</p>}
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={Math.max(1, Math.floor(duration))}
                step={1}
                value={Math.floor(currentTime) || 0}
                onChange={(e) => onSeek && onSeek(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs font-mono opacity-70">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 w-full">
              <button aria-label="Anterior" className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white" onClick={onPrev}>
                {/* Prev Icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <path d="M19 12H7" />
                  <path d="M12 19L5 12L12 5" />
                </svg>
              </button>
              <button aria-label="Play/Pausa" className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-green-600 text-white" onClick={onPlayPause}>
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path d="M8 5L19 12L8 19Z" />
                  </svg>
                )}
              </button>
              <button aria-label="Siguiente" className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-orange-600 text-white" onClick={onNext}>
                {/* Next Icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <path d="M5 12H17" />
                  <path d="M12 5L19 12L12 19" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 max-w-xs mx-auto w-full">
              <button aria-label="Mute" className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white" onClick={onToggleMute}>
                {isMuted || volume === 0 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                    <path d="M11 5L6 9H3v6h3l5 4V5z" />
                    <path d="M23 9l-6 6" />
                    <path d="M17 9l6 6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
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
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
