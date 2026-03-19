import { loadLiveOpsConfig, saveLiveOpsConfig } from "@/lib/liveops/config"
import { jsonNoStore } from "@/lib/liveops/api-utils"
import type { LiveOpsConfig } from "@/lib/liveops/types"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const dynamic = "force-static"

function isAuthorized(_request: Request): boolean {
  return true
}

export async function GET(req: Request) {
  if (IS_STATIC_EXPORT) {
    return jsonNoStore({ ok: false, error: "no_server" }, 501)
  }
  if (!isAuthorized(req)) {
    return jsonNoStore({ ok: false, error: "forbidden" }, 403)
  }
  try {
    const config = await loadLiveOpsConfig()
    return jsonNoStore({ ok: true, config })
  } catch {
    return jsonNoStore({ ok: false, error: "server_error" }, 500)
  }
}

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return jsonNoStore({ ok: false, error: "no_server" }, 501)
  }
  if (!isAuthorized(req)) {
    return jsonNoStore({ ok: false, error: "forbidden" }, 403)
  }
  try {
    const body = (await req.json()) as { config?: LiveOpsConfig }
    if (!body.config) {
      return jsonNoStore({ ok: false, error: "config_required" }, 400)
    }
    const config = await saveLiveOpsConfig(body.config)
    return jsonNoStore({ ok: true, config })
  } catch {
    return jsonNoStore({ ok: false, error: "server_error" }, 500)
  }
}
