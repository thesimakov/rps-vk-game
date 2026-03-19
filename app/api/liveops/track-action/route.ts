import { trackAction } from "@/lib/liveops/engine"
import type { TrackActionPayload } from "@/lib/liveops/types"
import { IS_STATIC_EXPORT, jsonNoStore, loadPlayerForLiveOps, mapError, persistPlayer } from "@/lib/liveops/api-utils"

export const dynamic = "force-static"

const ALLOWED_MODES = new Set(["elements_tournament", "time_is_money", "blind_luck", "boss_week"])
const ALLOWED_MOVES = new Set(["rock", "scissors", "paper", "water", "fire"])

function sanitizePayload(payload: TrackActionPayload): TrackActionPayload {
  const moves = Array.isArray(payload.movesUsed) ? payload.movesUsed.filter((m) => ALLOWED_MOVES.has(m)) : []
  return {
    type: "match_finished",
    won: !!payload.won,
    movesUsed: moves as TrackActionPayload["movesUsed"],
    skinIdUsed: typeof payload.skinIdUsed === "string" ? payload.skinIdUsed : undefined,
    betVoices: Math.max(0, Math.floor(payload.betVoices ?? 0)),
    bankVoices: Math.max(0, Math.floor(payload.bankVoices ?? 0)),
    mode: ALLOWED_MODES.has(payload.mode ?? "") ? payload.mode : undefined,
  }
}

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return jsonNoStore({ ok: false, error: "no_server" }, 501)
  }
  try {
    const body = (await req.json()) as { userId?: string; action?: TrackActionPayload; clientTimestamp?: number }
    if (body.clientTimestamp && body.clientTimestamp > Date.now() + 2 * 60 * 1000) {
      return jsonNoStore({ ok: false, error: "invalid_client_time" }, 400)
    }
    const player = await loadPlayerForLiveOps(body.userId ?? "")
    const payload = sanitizePayload((body.action ?? {}) as TrackActionPayload)
    const result = await trackAction(player, payload, Date.now())
    const saved = await persistPlayer(player)
    return jsonNoStore({
      ok: true,
      passGained: result.passGained,
      weeklyEvent: result.weeklyEvent,
      liveOpsState: saved.liveOpsState,
    })
  } catch (error) {
    return mapError(error)
  }
}
