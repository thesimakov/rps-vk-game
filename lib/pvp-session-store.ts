/**
 * Серверные сессии живого PvP (vk vs vk): оба хода раунда, исход, ack перед следующим раундом.
 */
import { getGameStateDb } from "@/lib/server-game-db"
import { getRoundOutcome } from "@/lib/match-outcome"
import type { RpsMove } from "@/lib/match-outcome"
import { isValidPlayerId, normalizeVkPlayerId } from "@/lib/player-store"
import { PVP_RULESET_MODE } from "@/lib/pvp-ruleset"

export { PVP_RULESET_MODE }

const MODE_MOVES: Record<string, RpsMove[]> = {
  /** Как на клиенте в арене: классика + карта «Вода» при наличии использований */
  classic: ["rock", "scissors", "paper", "water"],
  elements_tournament: ["fire", "water", "rock"],
  time_is_money: ["rock", "scissors", "paper"],
  blind_luck: ["rock", "scissors", "paper"],
  boss_week: ["rock", "scissors", "paper"],
}

function allowedMoves(weeklyMode: string): RpsMove[] {
  return MODE_MOVES[weeklyMode] ?? ["rock", "scissors", "paper"]
}

function isAllowed(m: string, weeklyMode: string): m is RpsMove {
  return allowedMoves(weeklyMode).includes(m as RpsMove)
}

export interface CreatePvpSessionInput {
  matchId: string
  p1Id: string
  p2Id: string
  totalRounds: number
  bet: number
  weeklyMode: string
}

export function createPvpSession(input: CreatePvpSessionInput) {
  const db = getGameStateDb()
  const now = Date.now()
  db.prepare(
    `INSERT OR REPLACE INTO pvp_match_sessions (
      match_id, p1_id, p2_id, total_rounds, bet, weekly_mode,
      current_round, p1_score, p2_score, p1_move, p2_move,
      pending_result, p1_ack, p2_ack, finished, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, 0, NULL, NULL, NULL, 0, 0, 0, ?)`,
  ).run(
    input.matchId,
    input.p1Id,
    input.p2Id,
    input.totalRounds,
    input.bet,
    input.weeklyMode,
    now,
  )
}

type Row = {
  match_id: string
  p1_id: string
  p2_id: string
  total_rounds: number
  bet: number
  weekly_mode: string
  current_round: number
  p1_score: number
  p2_score: number
  p1_move: string | null
  p2_move: string | null
  pending_result: string | null
  p1_ack: number
  p2_ack: number
  finished: number
  updated_at: number
}

function getRow(matchId: string): Row | undefined {
  return getGameStateDb()
    .prepare("SELECT * FROM pvp_match_sessions WHERE match_id = ?")
    .get(matchId) as Row | undefined
}

export function submitPvpMove(
  matchId: string,
  userId: string,
  move: string,
): { ok: true; draw?: boolean } | { ok: false; error: string } {
  if (!isValidPlayerId(userId)) return { ok: false, error: "invalid_user" }
  const uid = normalizeVkPlayerId(userId)
  const m = move as RpsMove
  const db = getGameStateDb()
  return db.transaction((): { ok: true; draw?: boolean } | { ok: false; error: string } => {
    const row = getRow(matchId)
    if (!row) return { ok: false as const, error: "no_session" }
    if (row.finished) return { ok: false as const, error: "finished" }
    if (row.pending_result) return { ok: false as const, error: "ack_pending" }
    if (!isAllowed(m, row.weekly_mode)) return { ok: false as const, error: "bad_move" }

    const isP1 = uid === normalizeVkPlayerId(row.p1_id)
    const isP2 = uid === normalizeVkPlayerId(row.p2_id)
    if (!isP1 && !isP2) return { ok: false as const, error: "not_in_match" }

    if (isP1 && row.p1_move) return { ok: false as const, error: "already_moved" }
    if (isP2 && row.p2_move) return { ok: false as const, error: "already_moved" }

    const p1Next = (isP1 ? m : row.p1_move) as RpsMove | null
    const p2Next = (isP2 ? m : row.p2_move) as RpsMove | null

    if (!p1Next || !p2Next) {
      db.prepare(
        `UPDATE pvp_match_sessions SET p1_move = ?, p2_move = ?, updated_at = ? WHERE match_id = ?`,
      ).run(p1Next, p2Next, Date.now(), matchId)
      return { ok: true as const }
    }

    const o = getRoundOutcome(p1Next, p2Next)
    if (o === "draw") {
      // Иначе клиент, сходивший первым, крутит poll до 200×350 мс — ждёт round_result, которого не было.
      const pending = JSON.stringify({
        is_draw: true,
        round: row.current_round,
        p1_move: p1Next,
        p2_move: p2Next,
        p1_score: row.p1_score,
        p2_score: row.p2_score,
        match_over: false,
      })
      db.prepare(
        `UPDATE pvp_match_sessions SET
          p1_move = NULL, p2_move = NULL,
          pending_result = ?, p1_ack = 0, p2_ack = 0,
          updated_at = ?
        WHERE match_id = ?`,
      ).run(pending, Date.now(), matchId)
      return { ok: true as const, draw: true as const }
    }

    let p1s = row.p1_score
    let p2s = row.p2_score
    if (o === "win") p1s += 1
    else p2s += 1

    const matchOver = row.current_round >= row.total_rounds
    const pending = JSON.stringify({
      round: row.current_round,
      p1_move: p1Next,
      p2_move: p2Next,
      p1_score: p1s,
      p2_score: p2s,
      match_over: matchOver,
    })

    db.prepare(
      `UPDATE pvp_match_sessions SET
        p1_move = NULL, p2_move = NULL,
        p1_score = ?, p2_score = ?,
        pending_result = ?, p1_ack = 0, p2_ack = 0,
        updated_at = ?
      WHERE match_id = ?`,
    ).run(p1s, p2s, pending, Date.now(), matchId)

    return { ok: true as const }
  })()
}

export function ackPvpRound(matchId: string, userId: string): { ok: true } | { ok: false; error: string } {
  if (!isValidPlayerId(userId)) return { ok: false, error: "invalid_user" }
  const uid = normalizeVkPlayerId(userId)
  const db = getGameStateDb()
  return db.transaction((): { ok: true } | { ok: false; error: string } => {
    const row = getRow(matchId)
    if (!row) return { ok: false as const, error: "no_session" }
    if (!row.pending_result) return { ok: false as const, error: "no_pending" }

    const isP1 = uid === normalizeVkPlayerId(row.p1_id)
    const isP2 = uid === normalizeVkPlayerId(row.p2_id)
    if (!isP1 && !isP2) return { ok: false as const, error: "not_in_match" }

    const p1Ack = isP1 ? 1 : row.p1_ack
    const p2Ack = isP2 ? 1 : row.p2_ack

    const pr = JSON.parse(row.pending_result) as { match_over: boolean; is_draw?: boolean }

    if (p1Ack && p2Ack) {
      if (pr.is_draw) {
        db.prepare(
          `UPDATE pvp_match_sessions SET pending_result = NULL, p1_ack = 0, p2_ack = 0, updated_at = ? WHERE match_id = ?`,
        ).run(Date.now(), matchId)
      } else if (pr.match_over) {
        db.prepare(
          `UPDATE pvp_match_sessions SET pending_result = NULL, p1_ack = 0, p2_ack = 0, finished = 1, updated_at = ? WHERE match_id = ?`,
        ).run(Date.now(), matchId)
      } else {
        db.prepare(
          `UPDATE pvp_match_sessions SET pending_result = NULL, p1_ack = 0, p2_ack = 0, current_round = current_round + 1, updated_at = ? WHERE match_id = ?`,
        ).run(Date.now(), matchId)
      }
    } else {
      db.prepare(
        `UPDATE pvp_match_sessions SET p1_ack = ?, p2_ack = ?, updated_at = ? WHERE match_id = ?`,
      ).run(p1Ack, p2Ack, Date.now(), matchId)
    }

    return { ok: true as const }
  })()
}

export function getPvpState(matchId: string, userId: string) {
  if (!isValidPlayerId(userId)) return { ok: false as const, error: "invalid_user" as const }
  const uid = normalizeVkPlayerId(userId)
  const row = getRow(matchId)
  if (!row) return { ok: false as const, error: "no_session" as const }
  if (row.finished) {
    return {
      ok: true as const,
      finished: true as const,
      p1Score: row.p1_score,
      p2Score: row.p2_score,
    }
  }

  if (row.pending_result) {
    const pr = JSON.parse(row.pending_result) as {
      round: number
      p1_move: RpsMove
      p2_move: RpsMove
      p1_score: number
      p2_score: number
      match_over: boolean
      is_draw?: boolean
    }
    const isP1 = uid === normalizeVkPlayerId(row.p1_id)
    const myMove = isP1 ? pr.p1_move : pr.p2_move
    const opponentMove = isP1 ? pr.p2_move : pr.p1_move
    const base = getRoundOutcome(pr.p1_move, pr.p2_move)
    let outcome: "win" | "loss" | "draw"
    if (base === "draw") outcome = "draw"
    else if (isP1) outcome = base === "win" ? "win" : "loss"
    else outcome = base === "win" ? "loss" : "win"

    return {
      ok: true as const,
      phase: "round_result" as const,
      round: pr.round,
      myMove,
      opponentMove,
      outcome,
      p1Score: pr.p1_score,
      p2Score: pr.p2_score,
      matchOver: pr.match_over,
    }
  }

  const isP1 = uid === normalizeVkPlayerId(row.p1_id)
  const myMove = isP1 ? row.p1_move : row.p2_move
  const oppMove = isP1 ? row.p2_move : row.p1_move

  return {
    ok: true as const,
    phase: "playing" as const,
    currentRound: row.current_round,
    totalRounds: row.total_rounds,
    p1Score: row.p1_score,
    p2Score: row.p2_score,
    waitingOpponent: !!myMove && !oppMove,
    waitingSelf: !myMove,
  }
}
