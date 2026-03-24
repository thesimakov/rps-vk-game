import { NextResponse, type NextRequest } from "next/server"
import { isValidPlayerId, normalizeVkPlayerId } from "@/lib/player-store"
import {
  abortMatchmaking,
  joinQueue,
  removeFromQueueBucketsOnly,
  type QueuePlayerPayload,
} from "@/lib/match-queue-store"
import { getUserIdFromGetRequest } from "@/lib/query-user-id"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function parseBody(body: unknown): QueuePlayerPayload | null {
  if (!body || typeof body !== "object") return null
  const o = body as Record<string, unknown>
  const userId = typeof o.userId === "string" ? o.userId : ""
  const name = typeof o.name === "string" ? o.name.slice(0, 64) : "Игрок"
  const avatar = typeof o.avatar === "string" ? o.avatar.slice(0, 8) : "?"
  const avatarUrl = typeof o.avatarUrl === "string" ? o.avatarUrl.slice(0, 2048) : ""
  const vip = Boolean(o.vip)
  const bet = typeof o.bet === "number" && Number.isFinite(o.bet) ? o.bet : 0
  const rounds = o.rounds === 1 || o.rounds === 3 || o.rounds === 5 ? o.rounds : 3
  if (!isValidPlayerId(userId)) return null
  return { userId: normalizeVkPlayerId(userId), name, avatar, avatarUrl, vip, bet, rounds }
}

/** Встать в очередь матчмейкинга */
export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const raw = await req.json()
    const payload = parseBody(raw)
    if (!payload) {
      return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 })
    }
    const result = joinQueue(payload)
    if (result.matched) {
      return NextResponse.json(
        {
          ok: true,
          matched: true,
          matchId: result.matchId,
          opponent: result.opponent,
        },
        { headers: { "Cache-Control": "no-store" } },
      )
    }
    return NextResponse.json({ ok: true, matched: false }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}

/**
 * Покинуть очередь.
 * По умолчанию — полная отмена (корзины + pending), кнопка «Отмена».
 * `?bucketsOnly=true` — только убрать из корзин ожидания; pending не трогаем
 * (размонтирование matchmaking, чтобы не сбрасывать готовую пару для игрока, который ждал первым).
 */
export async function DELETE(req: NextRequest) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const bucketsOnly = req.nextUrl.searchParams.get("bucketsOnly") === "true"
    let userId = ""
    try {
      const body = (await req.json()) as { userId?: string }
      userId = typeof body.userId === "string" ? body.userId : ""
    } catch {
      userId = ""
    }
    if (!userId) {
      userId = getUserIdFromGetRequest(req)
    }
    if (!isValidPlayerId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }
    const id = normalizeVkPlayerId(userId)
    if (bucketsOnly) {
      removeFromQueueBucketsOnly(id)
    } else {
      abortMatchmaking(id)
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
