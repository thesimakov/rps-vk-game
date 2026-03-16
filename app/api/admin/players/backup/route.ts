import { NextResponse } from "next/server"
import { backupDb } from "@/lib/player-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const dynamic = "force-static"

// Бэкап тоже делаем доступным из той же админки без отдельного секрета.
function isAuthorized(_request: Request): boolean {
  return true
}

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  try {
    await backupDb()
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

