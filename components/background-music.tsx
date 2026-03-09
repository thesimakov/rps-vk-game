"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Volume2, VolumeX } from "lucide-react"

const STORAGE_KEY = "rps_bg_music"
const MUSIC_SRC = "/bg-music.mp3"

export function BackgroundMusic() {
  const [enabled, setEnabled] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
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
  }, [loadStored])

  useEffect(() => {
    const audio = new Audio(MUSIC_SRC)
    audio.loop = true
    audio.volume = 0.35
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
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (enabled && ready) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [enabled, ready])

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
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-20 right-4 z-50 p-2.5 rounded-full bg-card/90 border border-border/50 text-foreground shadow-lg hover:bg-card transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={enabled && playing ? "Выключить музыку" : "Включить музыку"}
      title={enabled && playing ? "Музыка вкл." : "Музыка выкл."}
    >
      {enabled && playing ? (
        <Volume2 className="h-5 w-5 text-primary" />
      ) : (
        <VolumeX className="h-5 w-5 text-muted-foreground" />
      )}
    </button>
  )
}
