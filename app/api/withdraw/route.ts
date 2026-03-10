import { NextResponse } from "next/server"
import { isValidVkUserId } from "@/lib/referral-store"

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

    // TODO: здесь должна быть реальная логика:
    // - проверка баланса пользователя в БД
    // - учёт суммарного вывода за сутки (MAX_WITHDRAW_PER_DAY)
    // - создание заявки на вывод (БД/очередь)
    // - фактический перевод голосов/средств пользователю через API ВК или вручную

    // Пока просто симулируем успешное принятие заявки:
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

