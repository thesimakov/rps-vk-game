/**
 * Онлайн-присутствие игроков ВК: последний heartbeat с клиента.
 * Один инстанс Node; для масштаба — Redis с TTL.
 */

import { isValidPlayerId } from "@/lib/player-store"

/** Считаем онлайн, если heartbeat был не старше этого окна */
const ONLINE_WINDOW_MS = 90_000
/** Удаляем запись, если нет пингов дольше (чистка памяти) */
const STALE_PURGE_MS = 5 * 60_000

const lastSeen = new Map<string, number>()

export function recordPresence(userId: string) {
  if (!isValidPlayerId(userId)) return
  lastSeen.set(userId, Date.now())
}

/** Уникальные vk_* с недавним heartbeat — «онлайн в игре» */
export function getOnlineVkCount(): number {
  const now = Date.now()
  let n = 0
  for (const [uid, t] of lastSeen.entries()) {
    if (now - t > STALE_PURGE_MS) {
      lastSeen.delete(uid)
      continue
    }
    if (now - t <= ONLINE_WINDOW_MS && uid.startsWith("vk_")) n++
  }
  return n
}
