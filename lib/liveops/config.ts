import { promises as fs } from "fs"
import path from "path"
import type { LiveOpsConfig } from "./types"

const DEFAULT_CONFIG_PATH = path.join(process.cwd(), "config", "liveops-month-1.json")

let cache: { path: string; value: LiveOpsConfig } | null = null

function getConfigPath() {
  return process.env.LIVEOPS_CONFIG_PATH || DEFAULT_CONFIG_PATH
}

function assertConfig(config: LiveOpsConfig): LiveOpsConfig {
  if (!config.seasonId) throw new Error("liveops_config_invalid_season_id")
  if (!Number.isFinite(config.seasonDays) || config.seasonDays <= 0) throw new Error("liveops_config_invalid_season_days")
  if (!Number.isFinite(config.pass.maxLevel) || config.pass.maxLevel <= 0) throw new Error("liveops_config_invalid_pass")
  return config
}

export async function loadLiveOpsConfig(forceReload = false): Promise<LiveOpsConfig> {
  const filePath = getConfigPath()
  if (!forceReload && cache && cache.path === filePath) {
    return cache.value
  }
  const raw = await fs.readFile(filePath, "utf8")
  const parsed = JSON.parse(raw) as LiveOpsConfig
  const safe = assertConfig(parsed)
  cache = { path: filePath, value: safe }
  return safe
}

export async function saveLiveOpsConfig(config: LiveOpsConfig): Promise<LiveOpsConfig> {
  const filePath = getConfigPath()
  const safe = assertConfig(config)
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  const tmp = `${filePath}.tmp`
  await fs.writeFile(tmp, JSON.stringify(safe, null, 2), "utf8")
  await fs.rename(tmp, filePath)
  cache = { path: filePath, value: safe }
  return safe
}
