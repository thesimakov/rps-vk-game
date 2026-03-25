/** Снимок ожидающего приглашения друга (приглашающий): ждём accept в фоне. */

const PENDING_KEY = "rps_pending_friend_invite_v1"

export type PendingFriendInviteSnapshot = {
  inviteId: string
  fromUserId: string
  friend: {
    playerId: string
    vkId: number
    name: string
    wins: number
    photo_200?: string
  }
}

export function readPendingFriendInvite(playerId: string): PendingFriendInviteSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as PendingFriendInviteSnapshot
    if (p.fromUserId !== playerId || !p.inviteId || !p.friend?.playerId) return null
    return p
  } catch {
    return null
  }
}

export function writePendingFriendInvite(p: PendingFriendInviteSnapshot): void {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(p))
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rps-pending-friend-invite"))
  }
}

export function clearPendingFriendInvite(): void {
  sessionStorage.removeItem(PENDING_KEY)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rps-pending-friend-invite"))
  }
}

const FRIENDS_LIST_PREFIX = "rps_friends_ingame_list_v1_"

export function readFriendsInGameList(playerId: string): unknown[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(FRIENDS_LIST_PREFIX + playerId)
    if (!raw) return null
    const arr = JSON.parse(raw) as unknown
    return Array.isArray(arr) ? arr : null
  } catch {
    return null
  }
}

export function writeFriendsInGameList(playerId: string, rows: unknown[]): void {
  sessionStorage.setItem(FRIENDS_LIST_PREFIX + playerId, JSON.stringify(rows))
}
