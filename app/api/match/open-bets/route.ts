import { NextResponse, type NextRequest } from "next/server"
import { isValidPlayerId, normalizeVkPlayerId } from "@/lib/player-store"
import { deleteOpenBet, listOpenBets, upsertOpenBet, type OpenBetApi } from "@/lib/open-bets-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const runtime = "nodejs"

function parseBetBody(o: unknown): OpenBetApi | null {
  if (!o || typeof o !== "object") return null
  const b = o as Record<string, unknown>
  const id = typeof b.id === "string" ? b.id : ""
  const creatorIdRaw = typeof b.creatorId === "string" ? b.creatorId : ""
  if (!id || !isValidPlayerId(creatorIdRaw)) return null
  const creatorId = normalizeVkPlayerId(creatorIdRaw)
  const creatorName = typeof b.creatorName === "string" ? b.creatorName : "Игрок"
  const creatorAvatar = typeof b.creatorAvatar === "string" ? b.creatorAvatar : "?"
  const creatorWins = typeof b.creatorWins === "number" && Number.isFinite(b.creatorWins) ? b.creatorWins : 0
  const amount = typeof b.amount === "number" && Number.isInteger(b.amount) && b.amount > 0 ? b.amount : 0
  if (amount <= 0) return null
  const createdAt = typeof b.createdAt === "number" && Number.isFinite(b.createdAt) ? b.createdAt : Date.now()
  const rawRounds = b.totalRounds
  const totalRounds =
    rawRounds === 1 || rawRounds === 3 || rawRounds === 5 ? rawRounds : 1
  const expiresAt =
    typeof b.expiresAt === "number" && Number.isFinite(b.expiresAt) ? b.expiresAt : undefined
  return {
    id,
    creatorId,
    creatorName,
    creatorAvatar,
    creatorAvatarUrl: typeof b.creatorAvatarUrl === "string" ? b.creatorAvatarUrl : undefined,
    creatorWins,
    amount,
    createdAt,
    totalRounds,
    expiresAt,
    vip: Boolean(b.vip),
  }
}

export async function GET(req: NextRequest) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const url = new URL(req.url)
    const excludeUserId = url.searchParams.get("excludeUserId") ?? ""
    let bets = listOpenBets()
    if (excludeUserId && isValidPlayerId(excludeUserId)) {
      const norm = normalizeVkPlayerId(excludeUserId)
      bets = bets.filter((b) => b.creatorId !== norm)
    }
    return NextResponse.json({ ok: true, bets }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const body = (await req.json()) as { bet?: unknown }
    const bet = parseBetBody(body.bet)
    if (!bet) {
      return NextResponse.json({ ok: false, error: "invalid_bet" }, { status: 400 })
    }
    upsertOpenBet(bet)
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const url = new URL(req.url)
    const betId = url.searchParams.get("betId") ?? ""
    if (!betId) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 })
    }
    deleteOpenBet(betId)
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
