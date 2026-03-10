import { NextResponse } from "next/server"
import { claim, isValidVkUserId, upsertUser } from "@/lib/referral-store"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { userId?: string }
    const userId = typeof body.userId === "string" ? body.userId : ""
    if (!userId || !isValidVkUserId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }

    await upsertUser(userId)
    const res = await claim(userId)
    return NextResponse.json({ ok: true, amount: res.amount })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

