import type { TrackActionPayload } from "./types"

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const data = (await res.json()) as T
  if (!res.ok) {
    throw data
  }
  return data
}

export async function getLiveOpsState(userId: string) {
  return post("/api/liveops/state", { userId })
}

export async function claimDaily(userId: string) {
  return post("/api/liveops/claim-daily", { userId })
}

export async function restoreStreak(userId: string) {
  return post("/api/liveops/restore-streak", { userId })
}

export async function sendMatchResult(userId: string, action: TrackActionPayload) {
  return post("/api/liveops/track-action", {
    userId,
    action,
    clientTimestamp: Date.now(),
  })
}

export async function claimQuestReward(userId: string, questId: string) {
  return post("/api/liveops/claim-quest", { userId, questId })
}

export async function claimAchievementReward(userId: string, achievementId: string, setActive = true) {
  return post("/api/liveops/claim-achievement", { userId, achievementId, setActive })
}

export async function unlockPremiumPass(userId: string) {
  return post("/api/liveops/unlock-pass-premium", { userId })
}

export async function claimPassLevel(userId: string, level: number, premium = false) {
  return post("/api/liveops/claim-pass-reward", { userId, level, premium })
}
