import { promises as fs } from "fs"
import path from "path"

// Упрощённое серверное хранилище профиля игрока.
// В продакшене это лучше заменить на БД (Postgres и т.п.),
// но интерфейс модуля можно сохранить тем же.

export type PlayerId = `vk_${number}` | string

export interface StoredPlayer {
  id: PlayerId
  name: string
  avatar: string
  avatarUrl: string
  balance: number
  wins: number
  losses: number
  weekWins: number
  weekEarnings: number
  ratingPoints?: number
  totalPurchases?: number
  vip?: boolean
  fastMatchBoosts?: number
  victoryAnimation?: string
  cardSkin?: string
  cardDeck?: "ancient-rus"
  hasAncientDeck?: boolean
  avatarFrame?: string
  tournamentEntry?: boolean
  hideVkAvatar?: boolean
  lavaCardUses?: number
  waterCardUses?: number
  invitedFriends?: Array<{ id: number; first_name: string; last_name: string; photo_200: string } | null>
  invitedRewardClaimed?: boolean
  wallPostRewardClaimed?: boolean
  groupSubscribedRewardClaimed?: boolean
  lastDailyGiftClaimedAt?: number
  dailyRewardIndex?: number
  extraTimerUntil?: number
  lottoNumbers?: number[]
  lottoDrawAt?: number
  lottoDrawnNumbers?: number[]
  /** Сколько пользователь уже вывел за сегодня (для лимитов вывода) */
  withdrawTodayAmount?: number
  /** Дата (YYYY-MM-DD), к которой относится withdrawTodayAmount */
  withdrawTodayDate?: string
}

interface PlayerDb {
  players: Record<string, StoredPlayer>
}

const DB_RELATIVE_PATH = path.join("data", "players.json")

function getDbPath() {
  return path.join(process.cwd(), DB_RELATIVE_PATH)
}

async function ensureDir() {
  const dir = path.dirname(getDbPath())
  await fs.mkdir(dir, { recursive: true })
}

async function readDb(): Promise<PlayerDb> {
  await ensureDir()
  try {
    const raw = await fs.readFile(getDbPath(), "utf8")
    const parsed = JSON.parse(raw) as Partial<PlayerDb>
    return {
      players: parsed.players ?? {},
    }
  } catch {
    return { players: {} }
  }
}

async function writeDb(db: PlayerDb) {
  await ensureDir()
  const tmp = `${getDbPath()}.tmp`
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8")
  await fs.rename(tmp, getDbPath())
}

export function isValidPlayerId(id: string) {
  return id.startsWith("vk_") && id.length > 3
}

export async function loadPlayer(userId: PlayerId): Promise<StoredPlayer | null> {
  const db = await readDb()
  const existing = db.players[userId]
  return existing ?? null
}

export async function savePlayer(player: StoredPlayer): Promise<StoredPlayer> {
  const db = await readDb()
  const safeId = player.id
  db.players[safeId] = {
    ...player,
    id: safeId,
  }
  await writeDb(db)
  return db.players[safeId]
}

