import { NextResponse } from "next/server"

// В проде здесь должна быть реальная подпись по правилам ВК:
// https://dev.vk.com/bridge/VKWebAppOpenPayForm и документация по оплате голосами.
// Сейчас это лишь заглушка, чтобы фронт мог корректно общаться с сервером.

export const dynamic = "force-static"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT !== "0" && process.env.NODE_ENV === "production"

function getAppId() {
  const id = process.env.NEXT_PUBLIC_VK_APP_ID
  return typeof id === "string" ? id : ""
}

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }

  try {
    const body = (await req.json()) as { amount?: number; userId?: string }
    const amount = Number(body.amount)
    const userId = typeof body.userId === "string" ? body.userId : ""

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 })
    }

    const appId = getAppId()
    if (!appId) {
      return NextResponse.json({ ok: false, error: "no_app_id" }, { status: 500 })
    }

    // TODO: заменить на реальную подпись (hash/sign) на основе секретного ключа ВК и параметров платежа.
    // Сейчас используется фиктивное значение исключительно для разработки.
    const dummyHash = `dev-sign-${amount}-${userId || "anon"}`

    return NextResponse.json({ ok: true, app_id: Number(appId), hash: dummyHash })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

