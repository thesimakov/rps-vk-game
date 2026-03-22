/**
 * Онлайн-присутствие игроков ВК: последний heartbeat с клиента.
 *
 * Раньше хранилось в Map в памяти — при нескольких воркерах Node или serverless
 * POST /heartbeat и GET /online-count попадали в разные процессы → всегда 0.
 * Сейчас — общий JSON-файл рядом с players.json (один диск на VPS).
 * Для горизонтального масштаба без общего диска — Redis / KV.
 */

import { promises as fs } from "fs"
import path from "path"
import { isValidPlayerId } from "@/lib/player-store"

/** Считаем онлайн, если heartbeat был не старше этого окна */
const ONLINE_WINDOW_MS = 90_000
/** Удаляем запись, если нет пингов дольше (чистка памяти / файла) */
const STALE_PURGE_MS = 5 * 60_000

interface PresenceFile {
  lastSeen: Record<string, number>
}

function getPlayersJsonPath(): string {
  return (
    process.env.PLAYERS_DB_PATH ||
    (process.env.NODE_ENV === "development"
      ? path.join(process.cwd(), "data", "players.json")
      : "/var/rps-data/players.json")
  )
}

function getPresenceFilePath(): string {
  if (process.env.PRESENCE_DB_PATH) return process.env.PRESENCE_DB_PATH
  return path.join(path.dirname(getPlayersJsonPath()), "presence.json")
}

async function readPresence(): Promise<PresenceFile> {
  const filePath = getPresenceFilePath()
  try {
    const raw = await fs.readFile(filePath, "utf8")
    const parsed = JSON.parse(raw) as Partial<PresenceFile>
    return { lastSeen: typeof parsed.lastSeen === "object" && parsed.lastSeen !== null ? parsed.lastSeen : {} }
  } catch {
    return { lastSeen: {} }
  }
}

async function writePresence(data: PresenceFile): Promise<void> {
  const filePath = getPresenceFilePath()
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const tmp = `${filePath}.tmp`
  await fs.writeFile(tmp, JSON.stringify({ lastSeen: data.lastSeen }, null, process.env.NODE_ENV === "development" ? 2 : undefined), "utf8")
  await fs.rename(tmp, filePath)
}

function purgeStaleEntries(data: PresenceFile, now: number) {
  for (const [uid, t] of Object.entries(data.lastSeen)) {
    if (now - t > STALE_PURGE_MS) {
      delete data.lastSeen[uid]
    }
  }
}

/** Серийная очередь: не теряем обновления при параллельных heartbeat */
let writeChain: Promise<void> = Promise.resolve()

function enqueueWrite(fn: () => Promise<void>): Promise<void> {
  const next = writeChain.then(fn)
  writeChain = next.catch(() => {})
  return next
}

export async function recordPresence(userId: string): Promise<void> {
  if (!isValidPlayerId(userId)) return
  await enqueueWrite(async () => {
    const data = await readPresence()
    const now = Date.now()
    data.lastSeen[userId] = now
    purgeStaleEntries(data, now)
    await writePresence(data)
  })
}

/** Уникальные vk_* с недавним heartbeat — «онлайн в игре» */
export async function getOnlineVkCount(): Promise<number> {
  const data = await readPresence()
  const now = Date.now()
  let n = 0
  for (const [uid, t] of Object.entries(data.lastSeen)) {
    if (now - t > STALE_PURGE_MS) continue
    if (now - t <= ONLINE_WINDOW_MS && uid.startsWith("vk_")) n++
  }
  return n
}
