import { NextResponse } from "next/server"
import { getLiveVkPlayersInMatchmaking } from "@/lib/match-queue-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

export const dynamic = "force-static"

/** Сколько уникальных vk_* сейчас в матчмейкинге (очередь + ожидание пары по poll) */
export async function GET() {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server", count: 0 }, { status: 501 })
  }
  try {
    const count = getLiveVkPlayersInMatchmaking()
    return NextResponse.json({ ok: true, count }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server", count: 0 }, { status: 500 })
  }
}
