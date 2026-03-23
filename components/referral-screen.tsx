"use client"

import { useEffect, useMemo, useState } from "react"
import { appPath } from "@/lib/app-path"
import { useGame } from "@/lib/game-context"
import { ArrowLeft, Copy, Coins, Users, Link as LinkIcon, RefreshCw, HandCoins, Handshake } from "lucide-react"
import { formatAmount } from "@/lib/format-amount"
import { openBetSelectWithSharedPreset, normalizeSharedPreset } from "@/lib/play-invite-client"

type ReferralStatItem = {
  id: string
  createdAt: string
  claimedAt?: string
  referredId: string
  spendAmount: number
  commissionAmount: number
  reason: string
}

type ReferralStatsResponse =
  | { ok: false; error: string }
  | {
      ok: true
      referredCount: number
      totalReferredSpend: number
      totalEarned: number
      availableToClaim: number
      last: ReferralStatItem[]
      /** Реферер, если вы зашли по чужой ссылке */
      myReferrerId?: string | null
    }

async function safeCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement("textarea")
      el.value = text
      el.style.position = "fixed"
      el.style.left = "-9999px"
      document.body.appendChild(el)
      el.focus()
      el.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(el)
      return ok
    } catch {
      return false
    }
  }
}

export function ReferralScreen() {
  const { setScreen, player, vkUser, setPlayer, setCurrentBet, setTotalRounds } = useGame()
  const [stats, setStats] = useState<ReferralStatsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [copied, setCopied] = useState<"link" | "code" | null>(null)
  const [playInviteId, setPlayInviteId] = useState<string | null>(null)
  const [playInviteHint, setPlayInviteHint] = useState<string | null>(null)
  const [playInviteSending, setPlayInviteSending] = useState(false)

  const userId = player.id
  const canUse = vkUser != null && userId.startsWith("vk_")

  const referralCode = useMemo(() => (userId.startsWith("vk_") ? userId : ""), [userId])
  const referralLink = useMemo(() => {
    if (typeof window === "undefined") return ""
    const base = `${window.location.origin}${window.location.pathname}`
    return referralCode ? `${base}?ref=${encodeURIComponent(referralCode)}` : base
  }, [referralCode])

  const load = async () => {
    if (!canUse) return
    setLoading(true)
    try {
      const res = await fetch(appPath(`/api/referrals/stats?userId=${encodeURIComponent(userId)}`))
      const json = (await res.json()) as ReferralStatsResponse
      setStats(json)
    } catch {
      setStats({ ok: false, error: "network" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse, userId])

  const myReferrerId =
    stats && stats.ok && typeof stats.myReferrerId === "string" && stats.myReferrerId.length > 0
      ? stats.myReferrerId
      : null

  useEffect(() => {
    if (!playInviteId || !canUse) return
    let cancelled = false
    const poll = async () => {
      try {
        const res = await fetch(
          appPath(
            `/api/play-invite/waiter?inviteId=${encodeURIComponent(playInviteId)}&userId=${encodeURIComponent(userId)}`,
          ),
          { cache: "no-store" },
        )
        const data = (await res.json()) as {
          ok?: boolean
          ui?: string
          preset?: unknown
        }
        if (cancelled) return
        if (!data.ok) {
          setPlayInviteId(null)
          setPlayInviteHint("Запрос недоступен или истёк.")
          return
        }
        if (data.ui === "declined") {
          setPlayInviteHint("Игрок отклонил — ищем дальше: можно зайти в быстрый матч или отправить запрос позже.")
          setPlayInviteId(null)
          return
        }
        if (data.ui === "accepted") {
          openBetSelectWithSharedPreset(normalizeSharedPreset(data.preset), {
            setCurrentBet,
            setTotalRounds,
            setPlayer,
            setScreen,
          })
          setPlayInviteHint("Реферер принял — общий режим ставки.")
          setPlayInviteId(null)
          return
        }
        if (data.ui === "waiting_tournament") {
          setPlayInviteHint("Ожидаем окончание турнира у реферера…")
        } else if (data.ui === "waiting_response") {
          setPlayInviteHint("Ждём ответа реферера…")
        } else if (data.ui === "expired") {
          setPlayInviteHint(null)
          setPlayInviteId(null)
        }
      } catch {
        /* ignore */
      }
    }
    void poll()
    const t = setInterval(poll, 4000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [playInviteId, canUse, userId])

  const handleProposeGameToReferrer = async () => {
    if (!myReferrerId || playInviteSending) return
    setPlayInviteSending(true)
    try {
      const res = await fetch(appPath("/api/play-invite/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ fromUserId: userId, toUserId: myReferrerId }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        inviteId?: string
        waiterLabel?: string
        error?: string
      }
      if (data.ok && data.inviteId) {
        setPlayInviteId(data.inviteId)
        setPlayInviteHint(
          data.waiterLabel === "waiting_tournament"
            ? "Ожидаем окончание турнира у реферера…"
            : "Ждём ответа реферера…",
        )
      } else if (data.error === "already_pending") {
        setPlayInviteHint("Запрос уже отправлен — дождитесь ответа.")
      } else {
        setPlayInviteHint("Не удалось отправить запрос. Попробуйте позже.")
      }
    } catch {
      setPlayInviteHint("Ошибка сети.")
    } finally {
      setPlayInviteSending(false)
    }
  }

  const handleCopyLink = async () => {
    if (!referralLink) return
    const ok = await safeCopy(referralLink)
    setCopied(ok ? "link" : null)
    setTimeout(() => setCopied(null), 1200)
  }

  const handleCopyCode = async () => {
    if (!referralCode) return
    const ok = await safeCopy(referralCode)
    setCopied(ok ? "code" : null)
    setTimeout(() => setCopied(null), 1200)
  }

  const handleClaim = async () => {
    if (!canUse) return
    setClaiming(true)
    try {
      const res = await fetch(appPath("/api/referrals/claim"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const json = (await res.json()) as { ok: boolean; amount?: number }
      const amount = Math.max(0, Number(json.amount ?? 0))
      if (json.ok && amount > 0) {
        setPlayer((p) => ({ ...p, balance: p.balance + amount }))
      }
      await load()
    } finally {
      setClaiming(false)
    }
  }

  const referredCount = stats && stats.ok ? stats.referredCount : 0
  const totalSpend = stats && stats.ok ? stats.totalReferredSpend : 0
  const totalEarned = stats && stats.ok ? stats.totalEarned : 0
  const available = stats && stats.ok ? stats.availableToClaim : 0
  const last = stats && stats.ok ? stats.last : []

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 pb-24">
      <div className="w-full max-w-lg flex items-center mb-6">
        <button
          onClick={() => setScreen("profile")}
          className="p-2 rounded-xl hover:bg-muted/40 transition-colors text-foreground"
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-foreground uppercase tracking-wider">
          Реферальная программа
        </h1>
        <div className="w-9" />
      </div>

      {!canUse && (
        <div className="w-full max-w-lg bg-card/50 border border-border/30 rounded-2xl p-4">
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            Реферальная программа доступна после входа через ВК.
          </p>
        </div>
      )}

      {canUse && (
        <>
          <div className="w-full max-w-lg bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="h-4 w-4 text-primary" />
              <span className="font-bold text-foreground">Ваша ссылка</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-muted/20 border border-border/30 text-xs text-foreground truncate">
                {referralLink}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {copied === "link" && <p className="mt-2 text-xs text-primary font-bold">Ссылка скопирована</p>}
          </div>

          <div className="w-full max-w-lg bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-secondary" />
              <span className="font-bold text-foreground">Код приглашения</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-muted/20 border border-border/30 text-xs text-foreground truncate">
                {referralCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {copied === "code" && <p className="mt-2 text-xs text-secondary font-bold">Код скопирован</p>}
            <p className="mt-2 text-xs text-muted-foreground">
              Приглашайте друзей по ссылке/коду — вы получаете <span className="font-bold">10%</span> от их трат в игре.
            </p>
          </div>

          {myReferrerId && (
            <div className="w-full max-w-lg bg-card/40 backdrop-blur-sm border border-cyan-400/35 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Handshake className="h-4 w-4 text-cyan-300" />
                <span className="font-bold text-foreground">Игра с реферером</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Вы зашли по приглашению. Можно отправить рефереру запрос сыграть вместе: пока он в матче, статус —
                «ожидаем окончание турнира»; ему придёт уведомление с кнопками «Принять» и «Отклонить».
              </p>
              <button
                type="button"
                onClick={() => void handleProposeGameToReferrer()}
                disabled={playInviteSending || !!playInviteId}
                className="w-full py-2.5 rounded-xl bg-cyan-600/90 text-white text-sm font-bold disabled:opacity-50"
              >
                {playInviteSending ? "Отправка…" : playInviteId ? "Запрос активен" : "Предложить игру рефереру"}
              </button>
              {playInviteHint && (
                <p className="mt-2 text-xs text-cyan-200/90 font-medium leading-relaxed">{playInviteHint}</p>
              )}
            </div>
          )}

          <div className="w-full max-w-lg grid grid-cols-3 gap-3 mb-4">
            <div className="bg-card/50 border border-border/30 rounded-2xl px-3 py-3 flex flex-col items-center">
              <Users className="h-5 w-5 text-primary mb-1" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">приглашено</span>
              <span className="mt-1 text-lg font-extrabold text-foreground tabular-nums">{referredCount}</span>
            </div>
            <div className="bg-card/50 border border-border/30 rounded-2xl px-3 py-3 flex flex-col items-center">
              <Coins className="h-5 w-5 text-accent mb-1" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">их траты</span>
              <span className="mt-1 text-lg font-extrabold text-foreground tabular-nums">{formatAmount(totalSpend)}</span>
            </div>
            <div className="bg-card/50 border border-border/30 rounded-2xl px-3 py-3 flex flex-col items-center">
              <HandCoins className="h-5 w-5 text-secondary mb-1" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">получено</span>
              <span className="mt-1 text-lg font-extrabold text-foreground tabular-nums">{formatAmount(totalEarned)}</span>
            </div>
          </div>

          <div className="w-full max-w-lg bg-card/40 border border-border/30 rounded-2xl p-4 mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Использование</p>
              <p className="text-base font-extrabold text-foreground tabular-nums">{formatAmount(available)} монет</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-foreground"
                aria-label="Обновить"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={handleClaim}
                disabled={claiming || available <= 0}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
              >
                {claiming ? "..." : "Получить"}
              </button>
            </div>
          </div>

          <div className="w-full max-w-lg bg-card/30 border border-border/30 rounded-2xl p-4">
            <p className="text-sm font-bold text-foreground mb-3">Последние начисления</p>
            {last.length === 0 && (
              <p className="text-sm text-muted-foreground">Пока нет начислений.</p>
            )}
            <div className="flex flex-col gap-2">
              {last.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/10 border border-border/20 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {e.referredId} • {e.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      трата {formatAmount(e.spendAmount)} → +{formatAmount(e.commissionAmount)}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold ${e.claimedAt ? "text-muted-foreground" : "text-primary"}`}>
                    {e.claimedAt ? "получено" : "доступно"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

