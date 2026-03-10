import { NextResponse } from "next/server"
import { acceptReferral, isValidVkUserId } from "@/lib/referral-store"

export async function POST(req: Request) {
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

    const res = await acceptReferral(userId, referrerId)
    return NextResponse.json({ ok: true, ...res })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

