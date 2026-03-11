import { NextResponse } from "next/server"
import { isValidVkUserId } from "@/lib/referral-store"

export const dynamic = "force-static"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

export async function GET(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId") ?? ""
    if (!userId || !isValidVkUserId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }

    const { upsertUser, getStats } = await import("@/lib/referral-store")
    await upsertUser(userId)
    const stats = await getStats(userId)
    return NextResponse.json({ ok: true, ...stats })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

