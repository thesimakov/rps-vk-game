"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Volume2, VolumeX } from "lucide-react"

const STORAGE_KEY = "rps_bg_music"
const VOLUME_KEY = "rps_bg_music_volume"
// Учитываем basePath (GitHub Pages /rps-vk-game)
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "")
const MUSIC_SRC = `${BASE_PATH}/bg-music.mp3`

function clamp01(v: number) {
  if (!Number.isFinite(v)) return 0.35
  return Math.min(1, Math.max(0, v))
}

export function BackgroundMusic() {
  const [enabled, setEnabled] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const [volume, setVolume] = useState(0.35)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const loadStored = useCallback(() => {
    if (typeof window === "undefined") return false
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      return stored === "1"
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    const stored = loadStored()
    setEnabled(stored)
    try {
      const v = window.localStorage.getItem(VOLUME_KEY)
      if (v != null) setVolume(clamp01(Number(v)))
    } catch {}
  }, [loadStored])

  useEffect(() => {
    const audio = new Audio(MUSIC_SRC)
    audio.loop = true
    audio.volume = volume
    audio.preload = "auto"
    const onCanPlay = () => setReady(true)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onError = () => setReady(false)
    audio.addEventListener("canplaythrough", onCanPlay)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("error", onError)
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.removeEventListener("canplaythrough", onCanPlay)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("error", onError)
      audioRef.current = null
    }
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (enabled && ready) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [enabled, ready])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    try {
      window.localStorage.setItem(VOLUME_KEY, String(volume))
    } catch {}
  }, [volume])

  const toggle = useCallback(() => {
    const next = !enabled
    setEnabled(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
    } catch {}
    if (next && audioRef.current && ready) {
      audioRef.current.play().catch(() => {})
    } else if (!next && audioRef.current) {
      audioRef.current.pause()
    }
  }, [enabled, ready])

  return (
    <div className="fixed bottom-20 right-4 z-50 group">
      {/* Ползунок громкости (появляется при наведении/фокусе) */}
      <div
        className="absolute right-12 bottom-1/2 translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-card/90 border border-border/50 shadow-lg backdrop-blur">
          <span className="text-[10px] font-bold text-muted-foreground tabular-nums w-8 text-right">
            {Math.round(volume * 100)}%
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(clamp01(Number(e.target.value) / 100))}
            className="w-28 accent-primary"
            aria-label="Громкость музыки"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        className="p-2.5 rounded-full bg-card/90 border border-border/50 text-foreground shadow-lg hover:bg-card transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={enabled && playing ? "Выключить музыку" : "Включить музыку"}
        title={enabled && playing ? "Музыка вкл." : "Музыка выкл."}
      >
        {enabled && playing ? (
          <Volume2 className="h-5 w-5 text-primary" />
        ) : (
          <VolumeX className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
    </div>
  )
}
