\"use client\"

import { useEffect, useState } from \"react\"

export function GameLoader() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Фолбэк: если по какой‑то причине авторизация/загрузка длятся слишком долго — убираем лоадер.
    const t = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div className=\"rps-loader-overlay\">
      <div>
        <div className=\"rps-loader-ring\">
          <div className=\"rps-loader-segment\" />
          <div className=\"rps-loader-center\">
            <div className=\"rps-loader-icons\" aria-hidden>
              <span>🪨</span>
              <span>✂️</span>
              <span>📜</span>
            </div>
          </div>
        </div>
        <div className=\"rps-loader-text mt-4\">
          ЗАГРУЗКА АРЕНЫ
          <span className=\"rps-loader-dots ml-1\">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>
    </div>
  )
}

