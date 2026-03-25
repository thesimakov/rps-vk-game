"use client"

import { useEffect, useState } from "react"
import { appPath } from "@/lib/app-path"
import { useGame } from "@/lib/game-context"
import { normalizeSharedPreset } from "@/lib/play-invite-client"
import { Users, X, Check } from "lucide-react"
import { requestVkMiniAppNotifications } from "@/lib/vk-bridge"
import { markVkNotificationsMenuPromptDismissed } from "@/components/vk-notifications-prompt"
import { PlayerAvatar } from "@/components/player-avatar"
import type { Player } from "@/lib/game-context"

const INVITE_POLL_MS = 2800

type InviterProfile = {
  name: string
  avatar: string
  avatarUrl: string
  balance: number
  wins: number
  losses: number
  weekWins: number
  weekEarnings: number
  vip: boolean
}

function parseInviterProfile(raw: unknown): InviterProfile | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  if (typeof o.name !== "string" || !o.name.trim()) return null
  return {
    name: o.name,
    avatar: typeof o.avatar === "string" ? o.avatar : o.name.charAt(0) || "?",
    avatarUrl: typeof o.avatarUrl === "string" ? o.avatarUrl : "",
    balance: typeof o.balance === "number" && Number.isFinite(o.balance) ? o.balance : 0,
    wins: typeof o.wins === "number" && Number.isFinite(o.wins) ? o.wins : 0,
    losses: typeof o.losses === "number" && Number.isFinite(o.losses) ? o.losses : 0,
    weekWins: typeof o.weekWins === "number" && Number.isFinite(o.weekWins) ? o.weekWins : 0,
    weekEarnings: typeof o.weekEarnings === "number" && Number.isFinite(o.weekEarnings) ? o.weekEarnings : 0,
    vip: Boolean(o.vip),
  }
}

/** Баннер входящего приглашения (реферал → реферер или друг → друг). */
export function PlayInviteIncoming() {
  const {
    player,
    setCurrentBet,
    setTotalRounds,
    setOpponent,
    setOfflineMode,
    setPvpMatchId,
    setPlayer,
    setScreen,
  } =
    useGame()
  const [invite, setInvite] = useState<{
    id: string
    fromUserId: string
    preset: { bet: number; rounds: 1 | 3 | 5 } | null
    fromProfile: InviterProfile | null
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
          invites?: {
            id: string
            fromUserId: string
            fromProfile?: unknown
            preset?: { bet: number; rounds: 1 | 3 | 5; weeklyMode?: string } | null
          }[]
        }
        if (cancelled) return
        const raw = data.ok && data.invites?.length ? data.invites[0] : null
        const first = raw
          ? {
              id: raw.id,
              fromUserId: raw.fromUserId,
              fromProfile: parseInviterProfile(raw.fromProfile),
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
        const preset = normalizeSharedPreset(data.preset)

        const p1Candidate = player.id
        const p2Candidate = invite.fromUserId
        const toNumeric = (id: string) => {
          const n = Number(id.replace(/^vk_/, ""))
          return Number.isFinite(n) ? n : null
        }
        const n1 = toNumeric(p1Candidate)
        const n2 = toNumeric(p2Candidate)
        const [p1Id, p2Id] =
          n1 != null && n2 != null
            ? n1 <= n2
              ? [p1Candidate, p2Candidate]
              : [p2Candidate, p1Candidate]
            : p1Candidate <= p2Candidate
              ? [p1Candidate, p2Candidate]
              : [p2Candidate, p1Candidate]

        // Создаём серверную PvP-сессию, чтобы ходы второго игрока подтягивались,
        // а не имитировались локальным ботом.
        const matchId = invite.id
        await fetch(appPath("/api/match/create-pvp-session"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            matchId,
            p1Id,
            p2Id,
            totalRounds: preset.rounds,
            bet: preset.bet,
            weeklyMode: preset.weeklyMode,
          }),
        }).catch(() => {})

        // На стороне приглашенного ставка и число раундов уже согласованы —
        // стартуем арену 1×1 сразу.
        setOfflineMode(false)
        setPvpMatchId(invite.id)
        const inv = invite.fromProfile
        const opponentRow: Player = {
          id: invite.fromUserId,
          name: inv?.name ?? "Друг",
          avatar: inv?.avatar ?? "Д",
          avatarUrl: inv?.avatarUrl ?? "",
          balance: inv?.balance ?? 500,
          wins: inv?.wins ?? 0,
          losses: inv?.losses ?? 0,
          weekWins: inv?.weekWins ?? 0,
          weekEarnings: inv?.weekEarnings ?? preset.bet * 5,
          vip: inv?.vip ?? false,
        }
        setOpponent(opponentRow)
        setCurrentBet(preset.bet)
        setTotalRounds(preset.rounds)
        setPlayer((p) => ({
          ...p,
          activeWeeklyMode: undefined,
          bossWeekMatchChoice: undefined,
        }))
        setScreen("arena")
      }
    } catch {
      /* ignore */
    }
    setInvite(null)
  }

  if (!invite) return null

  const shortFromId =
    invite.fromUserId.length > 14 ? `${invite.fromUserId.slice(0, 12)}…` : invite.fromUserId
  const displayName = invite.fromProfile?.name ?? shortFromId

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto rounded-2xl border border-sky-400/40 bg-slate-950/95 backdrop-blur-md px-4 py-3 shadow-xl flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <Users className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-sky-100 leading-snug">
            Вас пригласили в турнир
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2">
          <div className="relative h-11 w-11 rounded-full overflow-hidden border border-white/20 shrink-0">
            {invite.fromProfile?.avatarUrl ? (
              <img src={invite.fromProfile.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <PlayerAvatar
                name={displayName}
                avatar={invite.fromProfile?.avatar ?? displayName.charAt(0)}
                size="sm"
                variant="muted"
                vip={invite.fromProfile?.vip ?? false}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">{displayName}</p>
            <p className="text-[11px] text-sky-200/75">
              {invite.fromProfile ? (
                <>
                  {invite.fromProfile.wins} побед
                  {invite.preset ? (
                    <>
                      {" · "}
                      турнир с вами
                    </>
                  ) : null}
                </>
              ) : (
                <>Игрок {shortFromId}</>
              )}
            </p>
          </div>
        </div>
        <p className="text-xs text-sky-200/80">
          {!invite.fromProfile ? (
            <>
              Идентификатор в системе:{" "}
              <span className="text-white font-mono text-[11px]">{shortFromId}</span>.{" "}
            </>
          ) : null}
          {invite.preset ? (
            <>
              Условия:{" "}
              <span className="text-sky-100 font-semibold">
                {invite.preset.rounds === 1 ? "1 ход" : invite.preset.rounds === 3 ? "3 хода" : "5 ходов"}, ставка{" "}
                {invite.preset.bet} монет
              </span>
              .{" "}
            </>
          ) : null}
          Примите — начнётся бой с этим игроком, или отклоните приглашение.
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
