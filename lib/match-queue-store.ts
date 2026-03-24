/**
 * Очередь матчмейкинга: состояние в SQLite (WAL), чтобы PM2 cluster / несколько воркеров
 * видели одну очередь. Раньше было только in-memory — пары и счётчики ломались между процессами.
 */

import { randomUUID } from "crypto"
import { isValidPlayerId } from "@/lib/player-store"
import { getGameStateDb } from "@/lib/server-game-db"
import { createPvpSession, PVP_RULESET_MODE } from "@/lib/pvp-session-store"

export interface QueuePlayerPayload {
  userId: string
  name: string
  avatar: string
  avatarUrl: string
  vip: boolean
  bet: number
  rounds: number
}

export interface QueueOpponent {
  id: string
  name: string
  avatar: string
  avatarUrl: string
  vip: boolean
  wins: number
  losses: number
  weekWins: number
  weekEarnings: number
  balance: number
}

interface QueuedEntry extends QueuePlayerPayload {
  enqueuedAt: number
}

interface PendingMatch {
  matchId: string
  opponent: QueueOpponent
  /** Корзина матча (ставка_раунды_режим) — для подсчёта live-count, пока ждущий ещё не сделал poll */
  bucketKey: string
}

interface StoredState {
  buckets: Record<string, QueuedEntry[]>
  pending: Record<string, PendingMatch | { matchId: string; opponent: QueueOpponent }>
}

const QUEUE_TTL_MS = 120_000

function bucketKey(bet: number, rounds: number) {
  return `${bet}_${rounds}`
}

function loadState(): StoredState {
  const row = getGameStateDb()
    .prepare("SELECT data FROM match_queue_state WHERE id = 1")
    .get() as { data: string }
  const parsed = JSON.parse(row.data) as StoredState
  if (!parsed.buckets || typeof parsed.buckets !== "object") parsed.buckets = {}
  if (!parsed.pending || typeof parsed.pending !== "object") parsed.pending = {}
  pruneStale(parsed)
  return parsed
}

function saveState(state: StoredState) {
  pruneStale(state)
  getGameStateDb()
    .prepare("UPDATE match_queue_state SET data = ? WHERE id = 1")
    .run(JSON.stringify(state))
}

function pruneStale(state: StoredState) {
  const now = Date.now()
  for (const [key, arr] of Object.entries(state.buckets)) {
    const next = arr.filter((e) => now - e.enqueuedAt < QUEUE_TTL_MS)
    if (next.length === 0) delete state.buckets[key]
    else state.buckets[key] = next
  }
}

function removeUserFromAllQueues(state: StoredState, userId: string) {
  for (const [key, arr] of Object.entries(state.buckets)) {
    const next = arr.filter((e) => e.userId !== userId)
    if (next.length === 0) delete state.buckets[key]
    else state.buckets[key] = next
  }
}

function payloadToOpponent(p: QueuePlayerPayload): QueueOpponent {
  return {
    id: p.userId,
    name: p.name,
    avatar: p.avatar,
    avatarUrl: p.avatarUrl,
    vip: p.vip,
    wins: 0,
    losses: 0,
    weekWins: 0,
    weekEarnings: 0,
    balance: 0,
  }
}

/**
 * Встать в очередь. Если в корзине уже есть другой игрок — сразу матч.
 * Ожидающий первым получает соперника через pollMatch.
 */
export function joinQueue(payload: QueuePlayerPayload):
  | { ok: true; matched: false }
  | { ok: true; matched: true; matchId: string; opponent: QueueOpponent } {
  const db = getGameStateDb()

  return db.transaction(() => {
    const state = loadState()
    const key = bucketKey(payload.bet, payload.rounds)
    removeUserFromAllQueues(state, payload.userId)

    let waiting = state.buckets[key] ?? []
    const now = Date.now()
    waiting = waiting.filter((e) => now - e.enqueuedAt < QUEUE_TTL_MS)
    waiting.sort((a, b) => a.enqueuedAt - b.enqueuedAt)

    const partner = waiting.find((e) => e.userId !== payload.userId)
    if (partner) {
      const remaining = waiting.filter((e) => e.userId !== partner.userId)
      if (remaining.length === 0) delete state.buckets[key]
      else state.buckets[key] = remaining
      const matchId = randomUUID()
      const joinerAsOpponent = payloadToOpponent(payload)
      const partnerAsOpponent = payloadToOpponent(partner)
      state.pending[partner.userId] = { matchId, opponent: joinerAsOpponent, bucketKey: key }
      saveState(state)
      /** В той же транзакции, что и очередь: иначе при сбое INSERT клиент получал matchId без строки в pvp_match_sessions → 400 на pvp-state */
      createPvpSession({
        matchId,
        p1Id: partner.userId,
        p2Id: payload.userId,
        totalRounds: payload.rounds,
        bet: payload.bet,
        weeklyMode: PVP_RULESET_MODE,
      })
      return { ok: true as const, matched: true as const, matchId, opponent: partnerAsOpponent }
    }

    const entry: QueuedEntry = { ...payload, enqueuedAt: now }
    waiting.push(entry)
    state.buckets[key] = waiting
    saveState(state)
    return { ok: true as const, matched: false as const }
  })()
}

export function pollMatch(userId: string):
  | { ok: true; matched: false }
  | { ok: true; matched: true; matchId: string; opponent: QueueOpponent } {
  if (!isValidPlayerId(userId)) {
    return { ok: true as const, matched: false as const }
  }
  const db = getGameStateDb()
  return db.transaction(() => {
    const state = loadState()
    const pending = state.pending[userId]
    if (!pending) {
      return { ok: true as const, matched: false as const }
    }
    delete state.pending[userId]
    saveState(state)
    return {
      ok: true as const,
      matched: true as const,
      matchId: pending.matchId,
      opponent: pending.opponent,
    }
  })()
}

export function leaveQueue(userId: string) {
  if (!isValidPlayerId(userId)) return
  const db = getGameStateDb()
  db.transaction(() => {
    const state = loadState()
    removeUserFromAllQueues(state, userId)
    delete state.pending[userId]
    saveState(state)
  })()
}

/** Уникальные vk_* в конкретной корзине (ставка / раунды / режим недели) */
export function getLiveVkPlayersInBucket(bet: number, rounds: number): number {
  const db = getGameStateDb()
  return db.transaction(() => {
    const state = loadState()
    const key = bucketKey(bet, rounds)
    const waiting = state.buckets[key] ?? []
    const now = Date.now()
    const ids = new Set<string>()
    for (const e of waiting) {
      if (now - e.enqueuedAt >= QUEUE_TTL_MS) continue
      if (e.userId.startsWith("vk_")) ids.add(e.userId)
    }
    /** Ждущий poll после пары не в buckets — без этого count=0 и клиент думает «один», включает бота */
    for (const [userId, p] of Object.entries(state.pending)) {
      if (!userId.startsWith("vk_")) continue
      const bk = "bucketKey" in p && typeof p.bucketKey === "string" ? p.bucketKey : ""
      if (bk === key) ids.add(userId)
    }
    return ids.size
  })()
}

/** Уникальные игроки ВК, сейчас в матчмейкинге: очередь + ожидание poll после пары */
export function getLiveVkPlayersInMatchmaking(): number {
  const db = getGameStateDb()
  return db.transaction(() => {
    const state = loadState()
    const ids = new Set<string>()
    for (const arr of Object.values(state.buckets)) {
      for (const e of arr) {
        if (e.userId.startsWith("vk_")) ids.add(e.userId)
      }
    }
    for (const userId of Object.keys(state.pending)) {
      if (userId.startsWith("vk_")) ids.add(userId)
    }
    return ids.size
  })()
}
