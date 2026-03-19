import { loadLiveOpsConfig } from "@/lib/liveops/config"
import { getWeeklyEventRuleSet } from "@/lib/liveops/engine"
import { IS_STATIC_EXPORT, jsonNoStore } from "@/lib/liveops/api-utils"

export const dynamic = "force-static"

export async function GET() {
  if (IS_STATIC_EXPORT) {
    return jsonNoStore({ ok: false, error: "no_server" }, 501)
  }
  try {
    const config = await loadLiveOpsConfig()
    const rules = getWeeklyEventRuleSet(config, Date.now())
    return jsonNoStore({ ok: true, rules })
  } catch {
    return jsonNoStore({ ok: false, error: "server_error" }, 500)
  }
}

export async function POST() {
  return GET()
}
