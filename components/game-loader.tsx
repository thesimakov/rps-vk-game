"use client"

import { useEffect, useState } from "react"

export function GameLoader() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Фолбэк: если по какой‑то причине авторизация/загрузка длятся слишком долго — убираем лоадер.
    const t = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div className="rps-loader-overlay">
      <div className="rps-loader-bar-wrap">
        <div className="rps-loader-bar-track">
          <div className="rps-loader-bar-fill" />
        </div>
        <div className="rps-loader-text">ЗАГРУЗКА АРЕНЫ</div>
      </div>
    </div>
  )
}

