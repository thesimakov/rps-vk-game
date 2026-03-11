import { NextResponse } from "next/server"
import { isValidVkUserId } from "@/lib/referral-store"

export const dynamic = "force-static"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const body = (await req.json()) as { userId?: string; amount?: number; reason?: string }
    const userId = typeof body.userId === "string" ? body.userId : ""
    const amount = Number(body.amount)
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim().slice(0, 64) : "spend"

    if (!userId || !isValidVkUserId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 })
    }

    const { recordSpend } = await import("@/lib/referral-store")
    const res = await recordSpend(userId, amount, reason)
    return NextResponse.json({ ok: true, commission: res.commission })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

