import path from "path"
import Database from "better-sqlite3"

// Серверное хранилище профиля игрока на SQLite.
// Файл БД лежит в data/players.sqlite относительно корня проекта.

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

const DB_RELATIVE_PATH = path.join("data", "players.sqlite")

function getDbPath(): string {
  return path.join(process.cwd(), DB_RELATIVE_PATH)
}

// Ленивое подключение к SQLite с автоматическим созданием таблицы.
let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    const dbPath = getDbPath()
    db = new Database(dbPath)
    db.pragma("journal_mode = WAL")
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      )
    `.trim()
    ).run()
  }
  return db
}

export function isValidPlayerId(id: string) {
  return id.startsWith("vk_") && id.length > 3
}

export async function loadPlayer(userId: PlayerId): Promise<StoredPlayer | null> {
  const database = getDb()
  const row = database
    .prepare<unknown[], { data: string }>("SELECT data FROM players WHERE id = ?")
    .get(userId)
  if (!row) return null
  try {
    const parsed = JSON.parse(row.data) as StoredPlayer
    return parsed ?? null
  } catch {
    return null
  }
}

export async function savePlayer(player: StoredPlayer): Promise<StoredPlayer> {
  const database = getDb()
  const safeId = player.id
  const toStore: StoredPlayer = {
    ...player,
    id: safeId,
  }
  const json = JSON.stringify(toStore)
  database
    .prepare("INSERT INTO players (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data")
    .run(safeId, json)
  return toStore
}

