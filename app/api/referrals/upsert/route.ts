import { NextResponse } from "next/server"
import { isValidVkUserId } from "@/lib/referral-store"

export const dynamic = "force-static"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT !== "0" && process.env.NODE_ENV === "production"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const body = (await req.json()) as { userId?: string }
    const userId = typeof body.userId === "string" ? body.userId : ""
    if (!userId || !isValidVkUserId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }
    const { upsertUser } = await import("@/lib/referral-store")
    await upsertUser(userId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

