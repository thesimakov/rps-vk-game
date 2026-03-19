import { NextResponse } from "next/server"
import { isValidPlayerId, loadPlayer, savePlayer, type StoredPlayer } from "@/lib/player-store"

export const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

export async function loadPlayerForLiveOps(userId: string): Promise<StoredPlayer> {
  if (!userId || !isValidPlayerId(userId)) {
    throw new Error("invalid_user")
  }
  const player = await loadPlayer(userId)
  if (!player) throw new Error("player_not_found")
  return player
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
