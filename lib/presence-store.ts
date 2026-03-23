/**
 * Онлайн-присутствие игроков ВК: heartbeat в SQLite (общий файл для всех воркеров).
 * Раньше был JSON на диске — при параллельной записи из разных процессов счётчик «1 онлайн».
 */

import { isValidPlayerId } from "@/lib/player-store"
import { getGameStateDb } from "@/lib/server-game-db"

/** Считаем онлайн, если heartbeat был не старше этого окна */
const ONLINE_WINDOW_MS = 90_000
/** Удаляем запись, если нет пингов дольше (чистка) */
const STALE_PURGE_MS = 5 * 60_000

/**
 * Фиксируем heartbeat (синхронная транзакция SQLite — видно всем воркерам).
 */
export async function recordPresence(userId: string): Promise<void> {
  if (!isValidPlayerId(userId)) return
  const db = getGameStateDb()
  const now = Date.now()
  db.transaction(() => {
    const cutoff = Date.now() - STALE_PURGE_MS
    db.prepare("DELETE FROM presence WHERE last_seen < ?").run(cutoff)
    db.prepare(`
      INSERT INTO presence (user_id, last_seen) VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET last_seen = excluded.last_seen
    `).run(userId, now)
  })()
}

/**
 * Сколько vk_* с недавним heartbeat.
 */
export async function getOnlineVkCount(): Promise<number> {
  const db = getGameStateDb()
  return db.transaction(() => {
    const cutoff = Date.now() - STALE_PURGE_MS
    db.prepare("DELETE FROM presence WHERE last_seen < ?").run(cutoff)
    const threshold = Date.now() - ONLINE_WINDOW_MS
    const row = db
      .prepare(
        `SELECT COUNT(*) AS c FROM presence WHERE user_id LIKE 'vk_%' AND last_seen >= ?`,
      )
      .get(threshold) as { c: number }
    return row.c
  })()
}
