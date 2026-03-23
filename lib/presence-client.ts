import { appPath } from "@/lib/app-path"

export function sendPresenceHeartbeat(userId: string, screen?: string): void {
  if (!userId.startsWith("vk_")) return
  void fetch(appPath("/api/presence/heartbeat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...(screen ? { screen } : {}) }),
  }).catch(() => {})
}
