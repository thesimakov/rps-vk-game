"use client"

import { useEffect, useRef, useCallback } from "react"

interface ConfettiPiece {
  x: number
  y: number
  w: number
  h: number
  rotation: number
  rotSpeed: number
  speedX: number
  speedY: number
  gravity: number
  color: string
  opacity: number
}

const COLORS = [
  "#FFD700", "#FF6B6B", "#4FC3F7", "#81C784",
  "#FF8A65", "#BA68C8", "#FFF176", "#64FFDA",
]

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const piecesRef = useRef<ConfettiPiece[]>([])
  const rafRef = useRef<number>(0)
  const hasSpawned = useRef(false)

  const spawn = useCallback((w: number, h: number) => {
    const pieces: ConfettiPiece[] = []
    const count = 120
    for (let i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * w,
        y: -Math.random() * h * 0.5 - 20,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        speedX: (Math.random() - 0.5) * 6,
        speedY: Math.random() * 2 + 2,
        gravity: 0.08 + Math.random() * 0.04,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: 1,
      })
    }
    piecesRef.current = pieces
  }, [])

  useEffect(() => {
    if (!active) {
      hasSpawned.current = false
      piecesRef.current = []
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    if (!hasSpawned.current) {
      spawn(canvas.width, canvas.height)
      hasSpawned.current = true
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let alive = 0
      for (const p of piecesRef.current) {
        p.speedY += p.gravity
        p.x += p.speedX
        p.y += p.speedY
        p.rotation += p.rotSpeed
        p.speedX *= 0.99

        if (p.y > canvas.height + 20) {
          p.opacity -= 0.05
        }

        if (p.opacity <= 0) continue
        alive++

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }

      if (alive > 0) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafRef.current)
  }, [active, spawn])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  )
}
