/**
 * Локальное хранилище друзей ВК, которым отправили приглашение в мини-приложение
 * (ещё без профиля в RPS Arena). Формат расширен: имена и фото для UI.
 */

export const LOWBALANCE_PENDING_KEY = "rps_vk_lowbalance_invited_v1"
export const LOWBALANCE_PENDING_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type PendingAppInviteEntry = {
  vkId: number
  first_name: string
  last_name: string
  photo_200: string
}

export type PendingAppInvitePayload = {
  createdAt: number
  entries: PendingAppInviteEntry[]
}

function entryFromVkUser(u: {
  id: number
  first_name: string
  last_name: string
  photo_200: string
}): PendingAppInviteEntry {
  return {
    vkId: u.id,
    first_name: typeof u.first_name === "string" ? u.first_name : "",
    last_name: typeof u.last_name === "string" ? u.last_name : "",
    photo_200: typeof u.photo_200 === "string" ? u.photo_200 : "",
  }
}

export function displayNameFromPendingEntry(e: PendingAppInviteEntry): string {
  const n = `${e.first_name} ${e.last_name}`.trim()
  return n || `Игрок ВК ${e.vkId}`
}

/** Снимок из localStorage или null (нет данных / истёк TTL). */
export function readPendingAppInvites(): PendingAppInvitePayload | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(LOWBALANCE_PENDING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return null
    const o = parsed as Record<string, unknown>
    const createdAt = typeof o.createdAt === "number" ? o.createdAt : NaN
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > LOWBALANCE_PENDING_TTL_MS) {
      return null
    }
    const invitesRaw = o.invites
    if (Array.isArray(invitesRaw) && invitesRaw.length) {
      const entries: PendingAppInviteEntry[] = []
      for (const x of invitesRaw) {
        if (!x || typeof x !== "object") continue
        const r = x as Record<string, unknown>
        const vkId = typeof r.vkId === "number" ? r.vkId : Number(r.vkId)
        if (!Number.isInteger(vkId) || vkId <= 0) continue
        entries.push({
          vkId,
          first_name: typeof r.first_name === "string" ? r.first_name : "",
          last_name: typeof r.last_name === "string" ? r.last_name : "",
          photo_200: typeof r.photo_200 === "string" ? r.photo_200 : "",
        })
      }
      if (!entries.length) return null
      return { createdAt, entries: entries.slice(0, 80) }
    }
    const idsRaw = o.ids
    if (Array.isArray(idsRaw) && idsRaw.length) {
      const ids = idsRaw
        .map((x) => (typeof x === "number" ? x : Number(x)))
        .filter((n): n is number => Number.isInteger(n) && n > 0)
        .slice(0, 80)
      if (!ids.length) return null
      return {
        createdAt,
        entries: ids.map((vkId) => ({
          vkId,
          first_name: "Друг",
          last_name: "",
          photo_200: "",
        })),
      }
    }
    return null
  } catch {
    return null
  }
}

export function writePendingAppInvites(payload: PendingAppInvitePayload): void {
  const entries = payload.entries.slice(0, 80)
  localStorage.setItem(
    LOWBALANCE_PENDING_KEY,
    JSON.stringify({
      createdAt: payload.createdAt,
      invites: entries,
      ids: entries.map((e) => e.vkId),
    }),
  )
}

/** Добавить/обновить выбранных из пикера ВК, сохранив старых и createdAt. */
export function mergePendingAppInvitesWithPickerUsers(
  existing: PendingAppInvitePayload | null,
  users: Array<{ id: number; first_name: string; last_name: string; photo_200: string }>,
): PendingAppInvitePayload {
  const createdAt = existing?.createdAt ?? Date.now()
  const byVk = new Map<number, PendingAppInviteEntry>()
  if (existing) {
    for (const e of existing.entries) {
      byVk.set(e.vkId, e)
    }
  }
  for (const u of users) {
    byVk.set(u.id, entryFromVkUser(u))
  }
  return { createdAt, entries: Array.from(byVk.values()).slice(0, 80) }
}

export function removePendingEntriesByVkIds(
  payload: PendingAppInvitePayload | null,
  vkIdsToRemove: Set<number>,
): PendingAppInvitePayload | null {
  if (!payload?.entries.length) return payload
  const next = payload.entries.filter((e) => !vkIdsToRemove.has(e.vkId))
  if (!next.length) return null
  return { createdAt: payload.createdAt, entries: next }
}
