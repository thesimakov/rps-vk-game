import { NextResponse } from "next/server"
import {
  isValidPlayerId,
  loadPlayer,
  normalizeVkPlayerId,
  savePlayer,
  type StoredPlayer,
} from "@/lib/player-store"

export const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

/** Минимальный профиль, если клиент ещё не успел вызвать /api/player/save (он откладывается ~1.5 с). */
function stubStoredPlayerForLiveOps(userId: string): StoredPlayer {
  const id = normalizeVkPlayerId(userId) as StoredPlayer["id"]
  return {
    id,
    name: "Игрок",
    avatar: "И",
    avatarUrl: "",
    balance: 0,
    wins: 0,
    losses: 0,
    weekWins: 0,
    weekEarnings: 0,
    vip: false,
    vkVoicesBalance: 0,
  }
}

export async function loadPlayerForLiveOps(userId: string): Promise<StoredPlayer> {
  if (!userId || !isValidPlayerId(userId)) {
    throw new Error("invalid_user")
  }
  const id = normalizeVkPlayerId(userId) as StoredPlayer["id"]
  const existing = await loadPlayer(id)
  if (existing) return existing
  return savePlayer(stubStoredPlayerForLiveOps(userId))
}

export async function persistPlayer(player: StoredPlayer) {
  return savePlayer(player)
}

export function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}

export function mapError(error: unknown) {
  const msg = error instanceof Error ? error.message : "server_error"
  if (msg === "invalid_user") return jsonNoStore({ ok: false, error: msg }, 400)
  if (msg === "player_not_found") return jsonNoStore({ ok: false, error: msg }, 404)
  if (msg.includes("insufficient_voices")) return jsonNoStore({ ok: false, error: msg }, 402)
  if (
    msg.includes("already") ||
    msg.includes("not_needed") ||
    msg.includes("locked") ||
    msg.includes("not_completed") ||
    msg.includes("invalid")
  ) {
    return jsonNoStore({ ok: false, error: msg }, 409)
  }
  return jsonNoStore({ ok: false, error: msg }, 500)
}
