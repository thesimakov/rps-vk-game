/**
 * Приглашение «сыграть вместе»: привязанный по рефералу игрок зовёт реферера.
 * Пока реферер в матче — у пригласившего статус «ожидаем окончание турнира».
 */

import { randomUUID } from "crypto"
import { isValidPlayerId, loadPlayer } from "@/lib/player-store"
import { getGameStateDb } from "@/lib/server-game-db"
import { getReferrerForUser } from "@/lib/referral-store"
import { getLastScreen } from "@/lib/presence-store"
import {
  buildTournamentInvitePreset,
  isValidTournamentInviteBet,
  type SharedMatchPreset,
} from "@/lib/play-invite-preset"

const INVITE_TTL_MS = 20 * 60 * 1000

export type PlayInviteState = "pending" | "waiting_match" | "declined" | "accepted" | "expired"

export type WaiterViewPreset = { bet: number; rounds: 1 | 3 | 5; weeklyMode: string }

let presetColumnReady = false

function ensurePlayInvitesTable() {
  const db = getGameStateDb()
  db.exec(`
    CREATE TABLE IF NOT EXISTS play_invites (
      id TEXT PRIMARY KEY NOT NULL,
      from_user_id TEXT NOT NULL,
      to_user_id TEXT NOT NULL,
      state TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      match_preset TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_play_invites_to ON play_invites(to_user_id, state);
    CREATE INDEX IF NOT EXISTS idx_play_invites_from ON play_invites(from_user_id, state);
  `)
  if (presetColumnReady) return
  const cols = db.prepare("PRAGMA table_info(play_invites)").all() as { name: string }[]
  const hasPresetColumn = cols.some((c) => c.name === "match_preset")
  if (!hasPresetColumn) {
    try {
      db.exec("ALTER TABLE play_invites ADD COLUMN match_preset TEXT")
    } catch {
      // Важно: не выставляем готовность, если ALTER не прошёл.
      // Иначе последующие SELECT/INSERT c match_preset будут падать с 500.
      return
    }
  }
  presetColumnReady = true
}

function pruneExpired() {
  const db = getGameStateDb()
  const cutoff = Date.now() - INVITE_TTL_MS
  db.prepare("DELETE FROM play_invites WHERE created_at < ?").run(cutoff)
}

export function isMatchBusyScreen(screen: string | null | undefined): boolean {
  if (!screen) return false
  return screen === "arena" || screen === "matchmaking" || screen === "result"
}

export type CreatePlayInviteResult =
  | { ok: true; inviteId: string; waiterLabel: "waiting_tournament" | "waiting_response" }
  | { ok: false; error: string }

/** Только referred → его referrer */
export async function createPlayInvite(fromUserId: string, toUserId: string): Promise<CreatePlayInviteResult> {
  if (!isValidPlayerId(fromUserId) || !isValidPlayerId(toUserId)) {
    return { ok: false, error: "invalid_user" }
  }
  const ref = await getReferrerForUser(fromUserId)
  if (!ref || ref !== toUserId) {
    return { ok: false, error: "not_referred_to_target" }
  }

  ensurePlayInvitesTable()
  pruneExpired()

  const db = getGameStateDb()
  const existing = db
    .prepare(
      `SELECT id FROM play_invites WHERE from_user_id = ? AND to_user_id = ? AND state IN ('pending', 'waiting_match')`,
    )
    .get(fromUserId, toUserId) as { id: string } | undefined
  if (existing) {
    return { ok: false, error: "already_pending" }
  }

  const targetScreen = getLastScreen(toUserId)
  const initialState: PlayInviteState = isMatchBusyScreen(targetScreen) ? "waiting_match" : "pending"
  const id = randomUUID()
  const now = Date.now()
  db.prepare(
    `INSERT INTO play_invites (id, from_user_id, to_user_id, state, created_at, updated_at, match_preset) VALUES (?, ?, ?, ?, ?, ?, NULL)`,
  ).run(id, fromUserId, toUserId, initialState, now, now)

  return {
    ok: true,
    inviteId: id,
    waiterLabel: initialState === "waiting_match" ? "waiting_tournament" : "waiting_response",
  }
}

/** Приглашение «турнир другу»: оба уже есть в базе игроков, пресет (ставка + ходы) задаётся при создании. */
export async function createFriendTournamentInvite(
  fromUserId: string,
  toUserId: string,
  bet: number,
  rounds: 1 | 3 | 5,
): Promise<CreatePlayInviteResult> {
  if (!isValidPlayerId(fromUserId) || !isValidPlayerId(toUserId)) {
    return { ok: false, error: "invalid_user" }
  }
  if (fromUserId === toUserId) {
    return { ok: false, error: "self_invite" }
  }
  if (!isValidTournamentInviteBet(bet, rounds)) {
    return { ok: false, error: "invalid_bet" }
  }

  const [fromP, toP] = await Promise.all([loadPlayer(fromUserId), loadPlayer(toUserId)])
  if (!fromP || !toP) {
    return { ok: false, error: "player_not_found" }
  }
  if (fromP.balance < bet) {
    return { ok: false, error: "insufficient_balance" }
  }
  if (toP.balance < bet) {
    return { ok: false, error: "opponent_insufficient_balance" }
  }

  ensurePlayInvitesTable()
  pruneExpired()

  const db = getGameStateDb()
  const existing = db
    .prepare(
      `SELECT id FROM play_invites WHERE from_user_id = ? AND to_user_id = ? AND state IN ('pending', 'waiting_match')`,
    )
    .get(fromUserId, toUserId) as { id: string } | undefined
  if (existing) {
    return { ok: false, error: "already_pending" }
  }

  const preset: SharedMatchPreset = buildTournamentInvitePreset(bet, rounds)
  const presetJson = JSON.stringify(preset)
  const targetScreen = getLastScreen(toUserId)
  const initialState: PlayInviteState = isMatchBusyScreen(targetScreen) ? "waiting_match" : "pending"
  const id = randomUUID()
  const now = Date.now()
  db.prepare(
    `INSERT INTO play_invites (id, from_user_id, to_user_id, state, created_at, updated_at, match_preset) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, fromUserId, toUserId, initialState, now, now, presetJson)

  return {
    ok: true,
    inviteId: id,
    waiterLabel: initialState === "waiting_match" ? "waiting_tournament" : "waiting_response",
  }
}

/** Синхронизация: реферер вышел из матча — показать уведомление */
function refreshWaitingToPending(db: ReturnType<typeof getGameStateDb>, toUserId: string) {
  const rows = db
    .prepare(`SELECT id FROM play_invites WHERE to_user_id = ? AND state = 'waiting_match'`)
    .all(toUserId) as { id: string }[]
  const screen = getLastScreen(toUserId)
  if (!isMatchBusyScreen(screen)) {
    const now = Date.now()
    for (const r of rows) {
      db.prepare(`UPDATE play_invites SET state = 'pending', updated_at = ? WHERE id = ?`).run(now, r.id)
    }
  }
}

export type IncomingPlayInviteRow = {
  id: string
  fromUserId: string
  state: PlayInviteState
  preset: WaiterViewPreset | null
}

function parseStoredPreset(json: string | null): WaiterViewPreset | null {
  if (!json) return null
  try {
    const p = JSON.parse(json) as WaiterViewPreset
    if (
      typeof p.bet === "number" &&
      (p.rounds === 1 || p.rounds === 3 || p.rounds === 5) &&
      typeof p.weeklyMode === "string"
    ) {
      return p
    }
  } catch {
    /* ignore */
  }
  return null
}

export function listIncomingInvites(toUserId: string): IncomingPlayInviteRow[] {
  if (!isValidPlayerId(toUserId)) return []
  ensurePlayInvitesTable()
  pruneExpired()
  const db = getGameStateDb()
  refreshWaitingToPending(db, toUserId)

  const rows = db
    .prepare(
      `SELECT id, from_user_id as fromUserId, state, match_preset FROM play_invites WHERE to_user_id = ? AND state IN ('pending', 'waiting_match') ORDER BY updated_at DESC`,
    )
    .all(toUserId) as {
    id: string
    fromUserId: string
    state: PlayInviteState
    match_preset: string | null
  }[]

  return rows.map((r) => ({
    id: r.id,
    fromUserId: r.fromUserId,
    state: r.state,
    preset: parseStoredPreset(r.match_preset),
  }))
}

export function respondPlayInvite(
  inviteId: string,
  toUserId: string,
  accept: boolean,
  matchPresetJson: string | null,
):
  | { ok: true; preset: WaiterViewPreset | null }
  | { ok: false; error: string } {
  if (!isValidPlayerId(toUserId)) return { ok: false, error: "invalid_user" }
  ensurePlayInvitesTable()
  const db = getGameStateDb()
  const row = db
    .prepare(`SELECT id, to_user_id, state, match_preset FROM play_invites WHERE id = ?`)
    .get(inviteId) as
    | { id: string; to_user_id: string; state: string; match_preset: string | null }
    | undefined
  if (!row || row.to_user_id !== toUserId) return { ok: false, error: "not_found" }
  if (!["pending", "waiting_match"].includes(row.state)) return { ok: false, error: "not_active" }

  const next: PlayInviteState = accept ? "accepted" : "declined"
  const now = Date.now()
  if (accept) {
    const existing = row.match_preset && row.match_preset.length > 0 ? row.match_preset : null
    const presetToStore = existing ?? matchPresetJson
    if (!presetToStore) {
      return { ok: false, error: "no_preset" }
    }
    db.prepare(`UPDATE play_invites SET state = ?, updated_at = ?, match_preset = ? WHERE id = ?`).run(
      next,
      now,
      presetToStore,
      inviteId,
    )
    return { ok: true, preset: parseStoredPreset(presetToStore) }
  }
  db.prepare(`UPDATE play_invites SET state = ?, updated_at = ? WHERE id = ?`).run(next, now, inviteId)
  return { ok: true, preset: null }
}

export function getWaiterView(
  inviteId: string,
  fromUserId: string,
): {
  state: PlayInviteState
  ui: "waiting_tournament" | "waiting_response" | "declined" | "accepted" | "expired"
  preset?: WaiterViewPreset | null
} | null {
  if (!isValidPlayerId(fromUserId)) return null
  ensurePlayInvitesTable()
  pruneExpired()
  const db = getGameStateDb()
  const row = db
    .prepare(`SELECT id, from_user_id, to_user_id, state, match_preset FROM play_invites WHERE id = ?`)
    .get(inviteId) as
    | { id: string; from_user_id: string; to_user_id: string; state: PlayInviteState; match_preset: string | null }
    | undefined
  if (!row || row.from_user_id !== fromUserId) return null

  const parsePreset = (): WaiterViewPreset | null => {
    if (!row.match_preset) return null
    try {
      const p = JSON.parse(row.match_preset) as WaiterViewPreset
      if (typeof p.bet === "number" && (p.rounds === 1 || p.rounds === 3 || p.rounds === 5) && typeof p.weeklyMode === "string") {
        return p
      }
    } catch {
      /* ignore */
    }
    return null
  }

  const toScreen = getLastScreen(row.to_user_id)
  if (row.state === "waiting_match") {
    if (!isMatchBusyScreen(toScreen)) {
      db.prepare(`UPDATE play_invites SET state = 'pending', updated_at = ? WHERE id = ?`).run(Date.now(), inviteId)
      return { state: "pending", ui: "waiting_response" }
    }
    return { state: "waiting_match", ui: "waiting_tournament" }
  }
  if (row.state === "pending") {
    return { state: "pending", ui: "waiting_response" }
  }
  if (row.state === "declined") return { state: "declined", ui: "declined" }
  if (row.state === "accepted") return { state: "accepted", ui: "accepted", preset: parsePreset() }
  return { state: "expired", ui: "expired" }
}
