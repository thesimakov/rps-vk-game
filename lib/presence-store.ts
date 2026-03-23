/**
 * Онлайн-присутствие игроков ВК: последний heartbeat с клиента.
 * Память + файл на диске (рядом с players.json), чтобы счётчик работал при
 * нескольких воркерах Node и не терялся при рестарте.
 */

import { promises as fs } from "fs"
import path from "path"
import { isValidPlayerId } from "@/lib/player-store"

/** Считаем онлайн, если heartbeat был не старше этого окна */
const ONLINE_WINDOW_MS = 90_000
/** Удаляем запись, если нет пингов дольше (чистка памяти и файла) */
const STALE_PURGE_MS = 5 * 60_000

function getPresencePath(): string {
  if (process.env.PRESENCE_DB_PATH) return process.env.PRESENCE_DB_PATH
  const playersPath = process.env.PLAYERS_DB_PATH
  if (playersPath) return path.join(path.dirname(playersPath), "presence.json")
  return process.env.NODE_ENV === "development"
    ? path.join(process.cwd(), "data", "presence.json")
    : "/var/rps-data/presence.json"
}

const lastSeen = new Map<string, number>()

/** Цепочка записей на диск — без гонок при параллельных heartbeat */
let persistChain: Promise<void> = Promise.resolve()

async function ensurePresenceDir() {
  await fs.mkdir(path.dirname(getPresencePath()), { recursive: true })
}

function collectPresenceEntries(parsed: Record<string, unknown>): [string, number][] {
  const out: [string, number][] = []
  const nested = parsed.lastSeen
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    for (const [uid, t] of Object.entries(nested as Record<string, unknown>)) {
      if (typeof t === "number" && Number.isFinite(t)) out.push([uid, t])
    }
  }
  for (const [uid, t] of Object.entries(parsed)) {
    if (uid === "lastSeen") continue
    if (typeof t === "number" && Number.isFinite(t)) out.push([uid, t])
  }
  return out
}

async function mergeFromDisk(): Promise<void> {
  try {
    const raw = await fs.readFile(getPresencePath(), "utf8")
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const now = Date.now()
    for (const [uid, t] of collectPresenceEntries(parsed)) {
      if (!uid.startsWith("vk_")) continue
      if (now - t > STALE_PURGE_MS) continue
      const prev = lastSeen.get(uid) ?? 0
      if (t > prev) lastSeen.set(uid, t)
    }
  } catch {
    // файла ещё нет или битый JSON
  }
}

async function flushToDisk(): Promise<void> {
  /** Иначе при нескольких воркерах/nginx каждый пишет только своих vk_* и затирает чужие записи → «всегда 1 онлайн». */
  await mergeFromDisk()
  const now = Date.now()
  const obj: Record<string, number> = {}
  for (const [uid, t] of lastSeen.entries()) {
    if (now - t > STALE_PURGE_MS) {
      lastSeen.delete(uid)
      continue
    }
    obj[uid] = t
  }
  try {
    await ensurePresenceDir()
    const p = getPresencePath()
    const tmp = `${p}.tmp`
    await fs.writeFile(tmp, JSON.stringify(obj), "utf8")
    await fs.rename(tmp, p)
  } catch {
    // игнорируем ошибки диска (read-only в serverless и т.д.)
  }
}

/**
 * Фиксируем heartbeat. Ждём сброс на диск — иначе другой воркер/nginx при следующем
 * GET /online-count видит пустую память и «0 онлайн».
 */
export async function recordPresence(userId: string): Promise<void> {
  if (!isValidPlayerId(userId)) return
  lastSeen.set(userId, Date.now())
  persistChain = persistChain.then(() => flushToDisk())
  await persistChain
}

function countOnlineVk(now: number): number {
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

/**
 * Сколько vk_* с недавним heartbeat.
 * Сначала подмешиваем данные с диска — нужно при нескольких воркерах / после рестарта.
 */
export async function getOnlineVkCount(): Promise<number> {
  await mergeFromDisk()
  const now = Date.now()
  return countOnlineVk(now)
}
