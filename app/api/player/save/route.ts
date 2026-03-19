import { NextResponse } from "next/server"
import { isValidPlayerId, loadPlayer, savePlayer, type StoredPlayer } from "@/lib/player-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const dynamic = "force-static"
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const TIMER_UPDATE_GRACE_MS = 5 * 60 * 1000

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }

  try {
    const body = (await req.json()) as { player?: StoredPlayer }
    const player = body.player

    if (!player || !player.id || !isValidPlayerId(player.id)) {
      return NextResponse.json({ ok: false, error: "invalid_player" }, { status: 400 })
    }

    const now = Date.now()
    const existing = await loadPlayer(player.id)
    let playerToSave: StoredPlayer = player

    if (existing) {
      const prevTimerBoughtAt = typeof existing.timerPlus10BoughtAt === "number" ? existing.timerPlus10BoughtAt : undefined
      const nextTimerBoughtAt = typeof player.timerPlus10BoughtAt === "number" ? player.timerPlus10BoughtAt : undefined
      const timerBoughtChanged = nextTimerBoughtAt !== prevTimerBoughtAt
      const cooldownReady = !prevTimerBoughtAt || now - prevTimerBoughtAt >= ONE_DAY_MS
      const timerPurchaseAllowed = timerBoughtChanged && !!nextTimerBoughtAt && cooldownReady

      const prevExtraTimerUntil = typeof existing.extraTimerUntil === "number" ? existing.extraTimerUntil : 0
      const nextExtraTimerUntil = typeof player.extraTimerUntil === "number" ? player.extraTimerUntil : 0
      const extraTimerIncreased = nextExtraTimerUntil > prevExtraTimerUntil

      // Защита от обхода клиента: увеличить буст таймера можно только
      // при валидной покупке (не чаще 1 раза в 24 часа).
      if (extraTimerIncreased && !timerPurchaseAllowed) {
        return NextResponse.json({ ok: false, error: "timer_purchase_cooldown" }, { status: 429 })
      }

      if (timerBoughtChanged && !timerPurchaseAllowed) {
        return NextResponse.json({ ok: false, error: "timer_purchase_cooldown" }, { status: 429 })
      }

      if (timerPurchaseAllowed) {
        const base = Math.max(prevExtraTimerUntil, now)
        const expectedExtraTimerUntil = base + ONE_DAY_MS
        const maxAllowedExtraTimerUntil = expectedExtraTimerUntil + TIMER_UPDATE_GRACE_MS
        const minAllowedExtraTimerUntil = expectedExtraTimerUntil - TIMER_UPDATE_GRACE_MS
        if (nextExtraTimerUntil < minAllowedExtraTimerUntil || nextExtraTimerUntil > maxAllowedExtraTimerUntil) {
          return NextResponse.json({ ok: false, error: "invalid_timer_payload" }, { status: 400 })
        }
        playerToSave = {
          ...player,
          timerPlus10BoughtAt: now,
          extraTimerUntil: expectedExtraTimerUntil,
        }
      }
    }

    const stored = await savePlayer(playerToSave)
    return NextResponse.json({ ok: true, player: stored }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

