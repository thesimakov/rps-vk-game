import { NextResponse } from "next/server"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

export const dynamic = IS_STATIC_EXPORT ? "force-static" : "force-dynamic"
export const runtime = "nodejs"

/**
 * Диагностика SQLite / better-sqlite3 на сервере (VPS).
 * В .env временно: ALLOW_SQLITE_DIAGNOSTIC=1
 * Затем: curl -s https://ваш-домен/api/health/sqlite
 * После отладки удалите переменную и перезапустите PM2.
 */
export async function GET() {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, reason: "static_export" }, { status: 501 })
  }
  if (process.env.ALLOW_SQLITE_DIAGNOSTIC !== "1") {
    return NextResponse.json(
      {
        ok: false,
        hint: "В .env на сервере задайте ALLOW_SQLITE_DIAGNOSTIC=1, перезапустите приложение, снова откройте этот URL. Потом удалите переменную.",
      },
      { status: 403 },
    )
  }
  try {
    const { getOnlineVkCount } = await import("@/lib/presence-store")
    const count = await getOnlineVkCount()
    return NextResponse.json({ ok: true, count }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error("[api/health/sqlite]", err)
    return NextResponse.json(
      { ok: false, message, stack },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
