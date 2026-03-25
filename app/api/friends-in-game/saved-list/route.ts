import { NextResponse } from "next/server"
import { isValidPlayerId } from "@/lib/player-store"
import { getSavedFriendsInGameList, setSavedFriendsInGameList, type SavedFriendRow } from "@/lib/friends-ingame-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const runtime = "nodejs"

function isSavedRow(x: unknown): x is SavedFriendRow {
  if (!x || typeof x !== "object") return false
  const o = x as Record<string, unknown>
  return (
    typeof o.playerId === "string" &&
    typeof o.vkId === "number" &&
    typeof o.name === "string" &&
    typeof o.wins === "number" &&
    (o.photo_200 === undefined || typeof o.photo_200 === "string")
  )
}

export async function GET(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId") ?? ""
    if (!isValidPlayerId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }
    const friends = getSavedFriendsInGameList(userId) ?? []
    return NextResponse.json({ ok: true, friends }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const body = (await req.json()) as { userId?: string; friends?: unknown }
    const userId = typeof body.userId === "string" ? body.userId : ""
    if (!isValidPlayerId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }
    const raw = Array.isArray(body.friends) ? body.friends : []
    const friends = raw.filter(isSavedRow)
    setSavedFriendsInGameList(userId, friends)
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
