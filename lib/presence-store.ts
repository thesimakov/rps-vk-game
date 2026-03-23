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

let presenceColumnMigrated = false

function ensurePresenceLastScreenColumn() {
  if (presenceColumnMigrated) return
  const db = getGameStateDb()
  try {
    db.exec("ALTER TABLE presence ADD COLUMN last_screen TEXT")
  } catch {
    /* колонка уже есть */
  }
  presenceColumnMigrated = true
}

/**
 * Фиксируем heartbeat (синхронная транзакция SQLite — видно всем воркерам).
 * @param lastScreen экран приложения — для «реферер в матче / ждём турнир».
 */
export async function recordPresence(userId: string, lastScreen?: string): Promise<void> {
  if (!isValidPlayerId(userId)) return
  ensurePresenceLastScreenColumn()
  const db = getGameStateDb()
  const now = Date.now()
  const screen = lastScreen && lastScreen.length <= 32 ? lastScreen : null
  db.transaction(() => {
    const cutoff = Date.now() - STALE_PURGE_MS
    db.prepare("DELETE FROM presence WHERE last_seen < ?").run(cutoff)
    db.prepare(`
      INSERT INTO presence (user_id, last_seen, last_screen) VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        last_seen = excluded.last_seen,
        last_screen = excluded.last_screen
    `).run(userId, now, screen)
  })()
}

/** Последний известный экран (для серверной логики приглашений). Синхронно. */
export function getLastScreen(userId: string): string | null {
  if (!isValidPlayerId(userId)) return null
  ensurePresenceLastScreenColumn()
  const db = getGameStateDb()
  const row = db.prepare("SELECT last_screen FROM presence WHERE user_id = ?").get(userId) as
    | { last_screen: string | null }
    | undefined
  return row?.last_screen ?? null
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
