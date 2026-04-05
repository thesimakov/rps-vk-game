/** Счётчик нажатий «играть» с главного меню (persist). */

export const PLAY_START_COUNT_STORAGE_KEY = "rps_play_start_count_v1"

/** Показывать полноэкранную рекламу каждый N-й запуск (1 = каждый раз). */
export const PLAY_START_AD_INTERVAL = 3

/**
 * Увеличивает счётчик и возвращает true, если на этот раз нужен показ рекламы.
 */
export function tickPlayStartAndShouldShowInterstitial(): boolean {
  if (typeof window === "undefined") return false
  try {
    const raw = window.localStorage.getItem(PLAY_START_COUNT_STORAGE_KEY)
    const prev = Math.max(0, parseInt(raw || "0", 10) || 0)
    const next = prev + 1
    window.localStorage.setItem(PLAY_START_COUNT_STORAGE_KEY, String(next))
    return PLAY_START_AD_INTERVAL > 0 && next % PLAY_START_AD_INTERVAL === 0
  } catch {
    return false
  }
}
