import { NextResponse } from "next/server"
import { isValidVkUserId } from "@/lib/referral-store"

export const dynamic = "force-static"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const body = (await req.json()) as { userId?: string; referrerId?: string }
    const userId = typeof body.userId === "string" ? body.userId : ""
    const referrerId = typeof body.referrerId === "string" ? body.referrerId : ""

    if (!userId || !isValidVkUserId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }
    if (!referrerId || !isValidVkUserId(referrerId) || referrerId === userId) {
      return NextResponse.json({ ok: false, error: "invalid_referrer" }, { status: 400 })
    }

    const { acceptReferral } = await import("@/lib/referral-store")
    const res = await acceptReferral(userId, referrerId)
    return NextResponse.json({ ok: true, ...res })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

