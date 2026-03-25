/**
 * Открытые ставки живых игроков (ожидают соперника) — SQLite, общий для воркеров.
 */
import { getGameStateDb } from "./server-game-db"

export type OpenBetRow = {
  id: string
  creator_id: string
  creator_name: string
  creator_avatar: string
  creator_avatar_url: string | null
  creator_wins: number
  amount: number
  total_rounds: number
  vip: number
  created_at: number
  expires_at: number | null
}

/** JSON для клиента — совпадает с BetEntry без botExpiresAt */
export type OpenBetApi = {
  id: string
  creatorId: string
  creatorName: string
  creatorAvatar: string
  creatorAvatarUrl?: string
  creatorWins: number
  amount: number
  createdAt: number
  expiresAt?: number
  totalRounds?: 1 | 3 | 5
  vip?: boolean
}

function rowToApi(r: OpenBetRow): OpenBetApi {
  return {
    id: r.id,
    creatorId: r.creator_id,
    creatorName: r.creator_name,
    creatorAvatar: r.creator_avatar,
    creatorAvatarUrl: r.creator_avatar_url ?? undefined,
    creatorWins: r.creator_wins,
    amount: r.amount,
    createdAt: r.created_at,
    expiresAt: r.expires_at ?? undefined,
    totalRounds: (r.total_rounds === 1 || r.total_rounds === 3 || r.total_rounds === 5 ? r.total_rounds : 1) as 1 | 3 | 5,
    vip: Boolean(r.vip),
  }
}

export function pruneExpiredOpenBets(now: number = Date.now()) {
  const db = getGameStateDb()
  db.prepare("DELETE FROM open_match_bets WHERE expires_at IS NOT NULL AND expires_at <= ?").run(now)
}

export function listOpenBets(now: number = Date.now()): OpenBetApi[] {
  pruneExpiredOpenBets(now)
  const db = getGameStateDb()
  const rows = db
    .prepare(
      `SELECT id, creator_id, creator_name, creator_avatar, creator_avatar_url, creator_wins,
              amount, total_rounds, vip, created_at, expires_at
       FROM open_match_bets
       WHERE expires_at IS NULL OR expires_at > ?
       ORDER BY vip DESC, created_at DESC`,
    )
    .all(now) as OpenBetRow[]
  return rows.map(rowToApi)
}

export function upsertOpenBet(b: OpenBetApi) {
  const db = getGameStateDb()
  db.prepare(
    `INSERT OR REPLACE INTO open_match_bets (
      id, creator_id, creator_name, creator_avatar, creator_avatar_url, creator_wins,
      amount, total_rounds, vip, created_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    b.id,
    b.creatorId,
    b.creatorName,
    b.creatorAvatar,
    b.creatorAvatarUrl ?? null,
    b.creatorWins,
    b.amount,
    b.totalRounds ?? 1,
    b.vip ? 1 : 0,
    b.createdAt,
    b.expiresAt ?? null,
  )
}

export function deleteOpenBet(betId: string): boolean {
  const db = getGameStateDb()
  const r = db.prepare("DELETE FROM open_match_bets WHERE id = ?").run(betId)
  return r.changes > 0
}
