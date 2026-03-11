import { NextResponse } from "next/server"
import crypto from "crypto"

// Подготовка данных для VKWebAppOpenPayForm.
// Универсально: можно использовать как для голосов ВК, так и для VK Pay / карт,
// в зависимости от значения поля "method" в теле запроса.
//
// Конкретные поля (action, params, merchant_id, sign, order_id и т.п.) должны
// соответствовать актуальной документации:
// https://dev.vk.com/bridge/VKWebAppOpenPayForm

export const dynamic = "force-static"

function getAppId() {
  const id = process.env.NEXT_PUBLIC_VK_APP_ID ?? process.env.VK_APP_ID
  return typeof id === "string" ? id : ""
}

function getMerchantId() {
  const id = process.env.VK_MERCHANT_ID
  return typeof id === "string" ? id : ""
}

function getSecretKey() {
  const key = process.env.VK_SECRET_KEY
  return typeof key === "string" ? key : ""
}

type PaymentMethod = "vk_voices" | "vk_pay"

function generateOrderId(userId: string, amount: number) {
  const base = `${userId || "anon"}:${amount}:${Date.now()}:${Math.random()}`
  return crypto.createHash("sha256").update(base).digest("hex").slice(0, 32)
}

function signPayload(payload: Record<string, unknown>, secret: string) {
  // Упорядочиваем ключи по алфавиту, конкатенируем "key=value" и считаем HMAC.
  // При необходимости скорректируйте формат под требования ВК.
  const keys = Object.keys(payload).sort()
  const data = keys.map((k) => `${k}=${String(payload[k] ?? "")}`).join("&")
  return crypto.createHmac("sha256", secret).update(data).digest("hex")
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      amount?: number
      userId?: string
      method?: PaymentMethod
      description?: string
      currency?: string
    }

    const amount = Number(body.amount)
    const userId = typeof body.userId === "string" ? body.userId : ""
    const method: PaymentMethod = body.method === "vk_pay" ? "vk_pay" : "vk_voices"
    const description = typeof body.description === "string" ? body.description.slice(0, 128) : "Пополнение баланса"

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 })
    }

    const appId = getAppId()
    if (!appId) {
      return NextResponse.json({ ok: false, error: "no_app_id" }, { status: 500 })
    }

    const secret = getSecretKey()
    if (!secret) {
      return NextResponse.json({ ok: false, error: "no_secret" }, { status: 500 })
    }

    const orderId = generateOrderId(userId, amount)

    // Базовый payload для VKWebAppOpenPayForm. При необходимости скорректируйте
    // поля под конкретный режим (голоса / VK Pay) согласно доке.
    const basePayload: Record<string, unknown> = {
      action: "pay-to-service",
      app_id: Number(appId),
      amount,
      description,
      order_id: orderId,
      user_id: userId,
      currency: method === "vk_voices" ? "votes" : body.currency || "RUB",
      merchant_id: getMerchantId() || undefined,
    }

    const sign = signPayload(basePayload, secret)

    return NextResponse.json({
      ok: true,
      app_id: Number(appId),
      order_id: orderId,
      method,
      payload: {
        ...basePayload,
        sign,
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

