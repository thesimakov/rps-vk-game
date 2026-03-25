import type { VKFriend } from "@/lib/vk-bridge"

export const PENDING_VK_APP_INVITES_KEY = "rps_vk_lowbalance_invited_v1"
export const PENDING_VK_APP_INVITES_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** Кому отправили приглашение в мини-приложение; профиль в RPS Arena ещё не создан */
export type PendingAppInviteEntry = {
  vkId: number
  name: string
  photo_200?: string
}

export function parsePendingAppPayload(raw: string | null): {
  entries: PendingAppInviteEntry[]
  createdAt: number
} | null {
  if (typeof window === "undefined" || !raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return null
    const o = parsed as { entries?: unknown; ids?: unknown; createdAt?: unknown }
    const createdAt = typeof o.createdAt === "number" ? o.createdAt : NaN
    if (!Number.isFinite(createdAt)) return null
    if (Date.now() - createdAt > PENDING_VK_APP_INVITES_TTL_MS) return null

    if (Array.isArray(o.entries)) {
      const entries: PendingAppInviteEntry[] = []
      for (const x of o.entries) {
        if (!x || typeof x !== "object") continue
        const e = x as { vkId?: unknown; name?: unknown; photo_200?: unknown }
        const vkId = typeof e.vkId === "number" ? e.vkId : Number(e.vkId)
        if (!Number.isInteger(vkId) || vkId <= 0) continue
        const name =
          typeof e.name === "string" && e.name.trim()
            ? e.name.trim()
            : `Друг ВК (${vkId})`
        const photo_200 =
          typeof e.photo_200 === "string" && e.photo_200.length > 0 ? e.photo_200 : undefined
        entries.push({ vkId, name, photo_200 })
      }
      return { entries: entries.slice(0, 80), createdAt }
    }

    if (Array.isArray(o.ids)) {
      const ids = o.ids
        .map((x) => (typeof x === "number" ? x : Number(x)))
        .filter((n): n is number => Number.isInteger(n) && n > 0)
      return {
        entries: ids.slice(0, 80).map((vkId) => ({ vkId, name: `Друг ВК (${vkId})` })),
        createdAt,
      }
    }
    return null
  } catch {
    return null
  }
}

export function writePendingAppInvitesToLS(entries: PendingAppInviteEntry[], createdAt: number): void {
  try {
    if (!entries.length) {
      localStorage.removeItem(PENDING_VK_APP_INVITES_KEY)
      return
    }
    localStorage.setItem(PENDING_VK_APP_INVITES_KEY, JSON.stringify({ entries, createdAt }))
  } catch {
    /* ignore */
  }
}

export function syncPendingEntriesAfterPick(users: VKFriend[], inGameRows: { vkId: number }[]): void {
  const inGameVk = new Set(inGameRows.map((f) => f.vkId))
  const prev = parsePendingAppPayload(localStorage.getItem(PENDING_VK_APP_INVITES_KEY))
  const createdAt = prev?.createdAt ?? Date.now()
  let next = (prev?.entries ?? []).filter((e) => !inGameVk.has(e.vkId))
  for (const u of users) {
    if (inGameVk.has(u.id)) continue
    const row: PendingAppInviteEntry = {
      vkId: u.id,
      name: `${u.first_name} ${u.last_name}`.trim() || `Друг ВК (${u.id})`,
      photo_200: u.photo_200?.length ? u.photo_200 : undefined,
    }
    const i = next.findIndex((e) => e.vkId === u.id)
    if (i >= 0) next[i] = row
    else next.push(row)
  }
  next = next.slice(0, 80)
  writePendingAppInvitesToLS(next, createdAt)
}

/** Слияние при выборе друзей из подсказки «низкий баланс» (не теряем прежний список ожидания). */
export function mergePendingEntriesFromVkFriends(users: VKFriend[]): void {
  const prev = parsePendingAppPayload(localStorage.getItem(PENDING_VK_APP_INVITES_KEY))
  const createdAt = prev?.createdAt ?? Date.now()
  const byVk = new Map<number, PendingAppInviteEntry>()
  for (const e of prev?.entries ?? []) byVk.set(e.vkId, e)
  for (const u of users) {
    byVk.set(u.id, {
      vkId: u.id,
      name: `${u.first_name} ${u.last_name}`.trim() || `Друг ВК (${u.id})`,
      photo_200: u.photo_200?.length ? u.photo_200 : undefined,
    })
  }
  writePendingAppInvitesToLS(Array.from(byVk.values()).slice(0, 80), createdAt)
}
