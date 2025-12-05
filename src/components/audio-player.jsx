"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle } from "lucide-react"
import { cn } from "@/lib/utils"

const tracks = [
  {
    id: 1,
    title: "Midnight Dreams",
    artist: "The Synthwave Collective",
    album: "Neon Nights",
    duration: 245,
    cover: "/synthwave-album-cover-purple-neon.jpg",
    src: "/audio/sample1.mp3",
  },
  {
    id: 2,
    title: "Electric Pulse",
    artist: "Digital Hearts",
    album: "Cyberpunk Sessions",
    duration: 198,
    cover: "/cyberpunk-album-cover-blue-electric.jpg",
    src: "/audio/sample2.mp3",
  },
  {
    id: 3,
    title: "Cosmic Journey",
    artist: "Space Cadets",
    album: "Beyond the Stars",
    duration: 312,
    cover: "/space-album-cover-galaxy-stars.jpg",
    src: "/audio/sample3.mp3",
  },
]

export function AudioPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(70)
  const [isMuted, setIsMuted] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const audioRef = useRef(null)

  const currentTrack = tracks[currentTrackIndex]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0
        audio.play()
      } else {
        handleNext()
      }
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [isRepeat, currentTrackIndex])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleNext = () => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length)
      setCurrentTrackIndex(randomIndex)
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length)
    }
    setIsPlaying(true)
    setTimeout(() => audioRef.current?.play(), 100)
  }

  const handlePrevious = () => {
    if (currentTime > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length)
      setIsPlaying(true)
      setTimeout(() => audioRef.current?.play(), 100)
    }
  }

  const handleSeek = (value) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value) => {
    setVolume(value[0])
    setIsMuted(value[0] === 0)
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(70)
      setIsMuted(false)
    } else {
      setVolume(0)
      setIsMuted(true)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-card rounded-xl shadow-2xl overflow-hidden border border-border">
        <div className="flex flex-col md:flex-row">
          {/* Album Cover - Side placement */}
          <div className="relative w-full md:w-80 md:h-80 aspect-square overflow-hidden bg-secondary flex-shrink-0">
            <img
              src={currentTrack.cover || "/placeholder.svg"}
              alt={currentTrack.album}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r md:bg-gradient-to-r from-transparent to-card/20" />
          </div>

          {/* Player Controls - Right side */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-center space-y-6">
            {/* Track Info */}
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-semibold text-balance">{currentTrack.title}</h2>
              <p className="text-muted-foreground text-lg">{currentTrack.artist}</p>
              <p className="text-sm text-muted-foreground">{currentTrack.album}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={currentTrack.duration}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-sm text-muted-foreground font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(currentTrack.duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-10 w-10 rounded-full transition-colors", isShuffle && "text-primary")}
                onClick={() => setIsShuffle(!isShuffle)}
              >
                <Shuffle className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-secondary"
                onClick={handlePrevious}
              >
                <SkipBack className="h-6 w-6" fill="currentColor" />
              </Button>

              <Button
                variant="default"
                size="icon"
                className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-7 w-7" fill="currentColor" />
                ) : (
                  <Play className="h-7 w-7 ml-1" fill="currentColor" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-secondary"
                onClick={handleNext}
              >
                <SkipForward className="h-6 w-6" fill="currentColor" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn("h-10 w-10 rounded-full transition-colors", isRepeat && "text-primary")}
                onClick={() => setIsRepeat(!isRepeat)}
              >
                <Repeat className="h-5 w-5" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 max-w-xs mx-auto w-full">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full flex-shrink-0" onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={currentTrack.src} />
    </div>
  )
}
