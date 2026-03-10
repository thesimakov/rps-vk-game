import { NextResponse } from "next/server"
import { getStats, isValidVkUserId, upsertUser } from "@/lib/referral-store"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId") ?? ""
    if (!userId || !isValidVkUserId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }

    await upsertUser(userId)
    const stats = await getStats(userId)
    return NextResponse.json({ ok: true, ...stats })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

