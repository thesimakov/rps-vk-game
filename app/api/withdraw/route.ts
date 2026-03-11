import { NextResponse } from "next/server"
import { isValidVkUserId } from "@/lib/referral-store"
import { loadPlayer, savePlayer } from "@/lib/player-store"

export const dynamic = "force-static"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT !== "0" && process.env.NODE_ENV === "production"

// Лимиты вывода: минимум 10 голосов, максимум 10 000 в сутки на пользователя
const MIN_WITHDRAW = 10
const MAX_WITHDRAW_PER_DAY = 10_000

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }

  try {
    const body = (await req.json()) as { userId?: string; amount?: number }
    const userId = typeof body.userId === "string" ? body.userId : ""
    const amount = Number(body.amount)

    if (!userId || !isValidVkUserId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }

    if (!Number.isFinite(amount) || amount < MIN_WITHDRAW) {
      return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 })
    }

    if (amount > MAX_WITHDRAW_PER_DAY) {
      return NextResponse.json({ ok: false, error: "limit_exceeded" }, { status: 400 })
    }

    const player = await loadPlayer(userId)
    if (!player) {
      return NextResponse.json({ ok: false, error: "no_player" }, { status: 400 })
    }

    if (!Number.isFinite(player.balance) || player.balance < amount) {
      return NextResponse.json({ ok: false, error: "insufficient_balance" }, { status: 400 })
    }

    const today = new Date().toISOString().slice(0, 10)
    const withdrawnToday =
      player.withdrawTodayDate === today && typeof player.withdrawTodayAmount === "number"
        ? player.withdrawTodayAmount
        : 0

    if (withdrawnToday + amount > MAX_WITHDRAW_PER_DAY) {
      return NextResponse.json({ ok: false, error: "limit_exceeded" }, { status: 400 })
    }

    // Здесь вы фактически обрабатываете выплату (через API ВК или вручную).
    // После успешной обработки уменьшаем баланс и обновляем суточный лимит.
    const updated = await savePlayer({
      ...player,
      balance: player.balance - amount,
      withdrawTodayAmount: withdrawnToday + amount,
      withdrawTodayDate: today,
    })

    return NextResponse.json({ ok: true, balance: updated.balance })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

