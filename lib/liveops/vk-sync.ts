import type { StoredPlayer } from "@/lib/player-store"

export interface VkSyncResult {
  voicesBalance: number
  vkIdVerified: boolean
  subscribedToGroup: boolean
}

/**
 * Adapter for VK API synchronization.
 * In production this function should call server-side VK endpoints:
 * - check user voices balance / billing events
 * - verify VK ID signature/session token
 * - verify community subscription
 */
export async function syncWithVkApi(player: StoredPlayer): Promise<VkSyncResult> {
  const voicesBalance = Math.max(0, player.vkVoicesBalance ?? 0)
  return {
    voicesBalance,
    vkIdVerified: player.id.startsWith("vk_"),
    subscribedToGroup: player.groupSubscribedRewardClaimed ?? false,
  }
}

export async function chargeVoices(player: StoredPlayer, amount: number): Promise<StoredPlayer> {
  const safeAmount = Math.max(0, Math.floor(amount))
  const current = Math.max(0, player.vkVoicesBalance ?? 0)
  if (current < safeAmount) {
    throw new Error("insufficient_voices")
  }
  return {
    ...player,
    vkVoicesBalance: current - safeAmount,
  }
}
