import { getGameStateDb } from "./server-game-db"
import { isValidPlayerId, normalizeVkPlayerId } from "./player-store"

export type SavedFriendRow = {
  playerId: string
  vkId: number
  name: string
  wins: number
  photo_200?: string
}

function parseRows(json: string): SavedFriendRow[] | null {
  try {
    const arr = JSON.parse(json) as unknown
    if (!Array.isArray(arr)) return null
    const out: SavedFriendRow[] = []
    for (const x of arr) {
      if (!x || typeof x !== "object") continue
      const o = x as Record<string, unknown>
      if (
        typeof o.playerId !== "string" ||
        typeof o.vkId !== "number" ||
        typeof o.name !== "string" ||
        typeof o.wins !== "number"
      ) {
        continue
      }
      out.push({
        playerId: o.playerId,
        vkId: o.vkId,
        name: o.name,
        wins: o.wins,
        photo_200: typeof o.photo_200 === "string" ? o.photo_200 : undefined,
      })
    }
    return out
  } catch {
    return null
  }
}

export function getSavedFriendsInGameList(userId: string): SavedFriendRow[] | null {
  if (!isValidPlayerId(userId)) return null
  const uid = normalizeVkPlayerId(userId)
  const db = getGameStateDb()
  const row = db.prepare("SELECT json FROM friends_ingame_saved WHERE user_id = ?").get(uid) as
    | { json: string }
    | undefined
  if (!row?.json) return null
  return parseRows(row.json)
}

export function setSavedFriendsInGameList(userId: string, rows: SavedFriendRow[]): void {
  if (!isValidPlayerId(userId)) return
  const uid = normalizeVkPlayerId(userId)
  const db = getGameStateDb()
  db.prepare(
    "INSERT OR REPLACE INTO friends_ingame_saved (user_id, json, updated_at) VALUES (?, ?, ?)",
  ).run(uid, JSON.stringify(rows), Date.now())
}
