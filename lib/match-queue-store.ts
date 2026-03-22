/**
 * In-memory очередь матчмейкинга (MVP).
 * Подходит для одного инстанса Node (dev / один сервер).
 * На serverless без общего стора — пары между разными воркерами не гарантируются; для продакшена — Redis и т.п.
 */

import { randomUUID } from "crypto"
import { isValidPlayerId } from "@/lib/player-store"

export interface QueuePlayerPayload {
  userId: string
  name: string
  avatar: string
  avatarUrl: string
  vip: boolean
  bet: number
  rounds: number
  weeklyMode: string
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

const QUEUE_TTL_MS = 120_000

const buckets = new Map<string, QueuedEntry[]>()
/** Игрок, который ждал в очереди первым — получает соперника через poll */
const pendingForWaiter = new Map<string, { matchId: string; opponent: QueueOpponent }>()

function bucketKey(bet: number, rounds: number, weeklyMode: string) {
  return `${bet}_${rounds}_${weeklyMode}`
}

function removeUserFromAllQueues(userId: string) {
  for (const [key, arr] of buckets.entries()) {
    const next = arr.filter((e) => e.userId !== userId)
    if (next.length !== arr.length) {
      if (next.length === 0) buckets.delete(key)
      else buckets.set(key, next)
    }
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
  const key = bucketKey(payload.bet, payload.rounds, payload.weeklyMode)
  removeUserFromAllQueues(payload.userId)

  let waiting = buckets.get(key) ?? []
  const now = Date.now()
  waiting = waiting.filter((e) => now - e.enqueuedAt < QUEUE_TTL_MS)

  const partner = waiting.find((e) => e.userId !== payload.userId)
  if (partner) {
    const remaining = waiting.filter((e) => e.userId !== partner.userId)
    if (remaining.length === 0) buckets.delete(key)
    else buckets.set(key, remaining)
    const matchId = randomUUID()
    const joinerAsOpponent = payloadToOpponent(payload)
    const partnerAsOpponent = payloadToOpponent(partner)
    pendingForWaiter.set(partner.userId, { matchId, opponent: joinerAsOpponent })
    return { ok: true, matched: true, matchId, opponent: partnerAsOpponent }
  }

  const entry: QueuedEntry = { ...payload, enqueuedAt: now }
  waiting.push(entry)
  buckets.set(key, waiting)
  return { ok: true, matched: false }
}

export function pollMatch(userId: string):
  | { ok: true; matched: false }
  | { ok: true; matched: true; matchId: string; opponent: QueueOpponent } {
  if (!isValidPlayerId(userId)) {
    return { ok: true, matched: false }
  }
  const pending = pendingForWaiter.get(userId)
  if (!pending) {
    return { ok: true, matched: false }
  }
  pendingForWaiter.delete(userId)
  return {
    ok: true,
    matched: true,
    matchId: pending.matchId,
    opponent: pending.opponent,
  }
}

export function leaveQueue(userId: string) {
  if (!isValidPlayerId(userId)) return
  removeUserFromAllQueues(userId)
  pendingForWaiter.delete(userId)
}

/** Уникальные игроки ВК, сейчас в матчмейкинге: очередь + ожидание poll после пары */
export function getLiveVkPlayersInMatchmaking(): number {
  const ids = new Set<string>()
  for (const arr of buckets.values()) {
    for (const e of arr) {
      if (e.userId.startsWith("vk_")) ids.add(e.userId)
    }
  }
  for (const userId of pendingForWaiter.keys()) {
    if (userId.startsWith("vk_")) ids.add(userId)
  }
  return ids.size
}
