"use client"

import { useEffect, useState } from "react"
import { appPath } from "@/lib/app-path"
import { useGame } from "@/lib/game-context"
import { openBetSelectWithSharedPreset, normalizeSharedPreset } from "@/lib/play-invite-client"
import { Users, X, Check } from "lucide-react"
import { requestVkMiniAppNotifications } from "@/lib/vk-bridge"
import { markVkNotificationsMenuPromptDismissed } from "@/components/vk-notifications-prompt"

const INVITE_POLL_MS = 2800

/** Баннер входящего приглашения (реферал → реферер или друг → друг). */
export function PlayInviteIncoming() {
  const { player, setCurrentBet, setTotalRounds, setPlayer, setScreen } = useGame()
  const [invite, setInvite] = useState<{
    id: string
    fromUserId: string
    preset: { bet: number; rounds: 1 | 3 | 5 } | null
  } | null>(null)

  useEffect(() => {
    if (!player.id.startsWith("vk_")) return
    let cancelled = false
    const tick = async () => {
      try {
        const res = await fetch(
          appPath(`/api/play-invite/incoming?userId=${encodeURIComponent(player.id)}`),
          { cache: "no-store" },
        )
        const data = (await res.json()) as {
          ok?: boolean
          invites?: { id: string; fromUserId: string; preset?: { bet: number; rounds: 1 | 3 | 5 } | null }[]
        }
        if (cancelled) return
        const raw = data.ok && data.invites?.length ? data.invites[0] : null
        const first = raw
          ? {
              id: raw.id,
              fromUserId: raw.fromUserId,
              preset:
                raw.preset &&
                typeof raw.preset.bet === "number" &&
                (raw.preset.rounds === 1 || raw.preset.rounds === 3 || raw.preset.rounds === 5)
                  ? { bet: raw.preset.bet, rounds: raw.preset.rounds }
                  : null,
            }
          : null
        setInvite(first)
      } catch {
        if (!cancelled) setInvite(null)
      }
    }
    void tick()
    const t = setInterval(tick, INVITE_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [player.id])

  useEffect(() => {
    if (!invite) return
    if (typeof window === "undefined") return
    const key = `rps_vk_notif_ask_${invite.id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, "1")
    void requestVkMiniAppNotifications().then((allowed) => {
      if (allowed) markVkNotificationsMenuPromptDismissed()
    })
  }, [invite?.id])

  const respond = async (accept: boolean) => {
    if (!invite) return
    try {
      const res = await fetch(appPath("/api/play-invite/respond"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ inviteId: invite.id, userId: player.id, accept }),
      })
      const data = (await res.json()) as { ok?: boolean; preset?: unknown }
      if (accept && data.ok && data.preset) {
        openBetSelectWithSharedPreset(normalizeSharedPreset(data.preset), {
          setCurrentBet,
          setTotalRounds,
          setPlayer,
          setScreen,
        })
      }
    } catch {
      /* ignore */
    }
    setInvite(null)
  }

  if (!invite) return null

  const shortFrom = invite.fromUserId.length > 12 ? `${invite.fromUserId.slice(0, 10)}…` : invite.fromUserId

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto rounded-2xl border border-sky-400/40 bg-slate-950/95 backdrop-blur-md px-4 py-3 shadow-xl flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <Users className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-sky-100 leading-snug">
            Вас пригласили в игру
          </p>
        </div>
        <p className="text-xs text-sky-200/80">
          Запрос от <span className="text-white font-mono text-[11px]">{shortFrom}</span>.
          {invite.preset ? (
            <>
              {" "}
              Условия:{" "}
              <span className="text-sky-100 font-semibold">
                {invite.preset.rounds === 1 ? "1 ход" : invite.preset.rounds === 3 ? "3 хода" : "5 ходов"}, ставка{" "}
                {invite.preset.bet}
              </span>
              .
            </>
          ) : null}{" "}
          Примите или отклоните приглашение.
        </p>
        <p className="text-[10px] text-sky-300/70 leading-snug">
          В настройках ВК включите уведомления от приложения — так проще не пропускать новые приглашения.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void respond(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold"
          >
            <Check className="h-4 w-4" /> Принять
          </button>
          <button
            type="button"
            onClick={() => void respond(false)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-bold"
          >
            <X className="h-4 w-4" /> Отклонить
          </button>
        </div>
      </div>
    </div>
  )
}
