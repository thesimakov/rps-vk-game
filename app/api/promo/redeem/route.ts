import { NextResponse } from "next/server"
import { isValidVkUserId } from "@/lib/referral-store"
import { redeemPromoCode, type PromoReward } from "@/lib/promo-store"

export const dynamic = "force-static"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { userId?: string; code?: string }
    const userId = typeof body.userId === "string" ? body.userId : ""
    const code = typeof body.code === "string" ? body.code : ""

    if (!userId || !isValidVkUserId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }
    if (!code.trim()) {
      return NextResponse.json({ ok: false, error: "empty" }, { status: 400 })
    }

    const res = await redeemPromoCode(userId, code)
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 })
    }

    const reward: PromoReward = res.reward
    return NextResponse.json({ ok: true, reward })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

