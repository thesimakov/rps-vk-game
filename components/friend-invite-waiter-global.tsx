"use client"

import { useEffect, useRef } from "react"
import { appPath } from "@/lib/app-path"
import { useGame } from "@/lib/game-context"
import { normalizeSharedPreset } from "@/lib/play-invite-client"
import {
  readPendingFriendInvite,
  clearPendingFriendInvite,
  type PendingFriendInviteSnapshot,
  readFriendsInGameList,
  writeFriendsInGameList,
} from "@/lib/friend-invite-pending"

const POLL_MS = 2800

/**
 * Пока приглашённый не ответил — опрашиваем waiter. При принятии — арена 1×1 с другом (условия из приглашения).
 */
export function FriendInviteWaiterGlobal() {
  const {
    player,
    setScreen,
    setOpponent,
    setCurrentBet,
    setTotalRounds,
    setPlayer,
    screen,
    setOfflineMode,
    setPvpMatchId,
  } = useGame()
  const screenRef = useRef(screen)
  const busyRef = useRef(false)

  useEffect(() => {
    screenRef.current = screen
  }, [screen])

  useEffect(() => {
    if (!player.id.startsWith("vk_")) return

    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    const stopInterval = () => {
      if (intervalId != null) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    const runAccepted = async (snap: PendingFriendInviteSnapshot, presetRaw: unknown) => {
      if (busyRef.current) return
      busyRef.current = true
      clearPendingFriendInvite()

      // Инвайтер после принятия приглашения должен видеть друга в списке
      // «С друзьями» (чтобы можно было сразу снова приглашать в турнир).
      try {
        const raw = readFriendsInGameList(player.id)
        const current = Array.isArray(raw) ? raw : []
        const exists = current.some(
          (x) => x && typeof x === "object" && (x as { playerId?: unknown }).playerId === snap.friend.playerId,
        )
        if (!exists) {
          current.push({
            playerId: snap.friend.playerId,
            vkId: snap.friend.vkId,
            name: snap.friend.name,
            wins: snap.friend.wins,
            photo_200: snap.friend.photo_200,
          })
          writeFriendsInGameList(player.id, current)
        }
      } catch {
        /* ignore */
      }

      const preset = normalizeSharedPreset(presetRaw)

      // Чтобы второй игрок делал ход по PvP (а не локально как бот),
      // создаём серверную PvP-сессию и выставляем pvpMatchId = inviteId.
      const p1Candidate = player.id
      const p2Candidate = snap.friend.playerId
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

      const matchId = snap.inviteId
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

      setOfflineMode(false)
      setPvpMatchId(matchId)
      setOpponent({
        id: snap.friend.playerId,
        name: snap.friend.name,
        avatar: snap.friend.name.charAt(0) || "?",
        avatarUrl: snap.friend.photo_200 ?? "",
        balance: 500,
        wins: snap.friend.wins,
        losses: 20,
        weekWins: Math.max(0, Math.floor(snap.friend.wins / 2)),
        weekEarnings: preset.bet * 5,
        vip: false,
      })
      setCurrentBet(preset.bet)
      setTotalRounds(preset.rounds)
      setPlayer((p) => ({
        ...p,
        activeWeeklyMode: undefined,
        bossWeekMatchChoice: undefined,
      }))
      setScreen("arena")
      queueMicrotask(() => {
        busyRef.current = false
      })
    }

    const pollOnce = async () => {
      if (cancelled) return
      const scr = screenRef.current
      if (["arena", "matchmaking", "result"].includes(scr)) return
      const pending = readPendingFriendInvite(player.id)
      if (!pending || busyRef.current) return

      try {
        const res = await fetch(
          appPath(
            `/api/play-invite/waiter?inviteId=${encodeURIComponent(pending.inviteId)}&userId=${encodeURIComponent(player.id)}`,
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
          clearPendingFriendInvite()
          stopInterval()
          return
        }
        if (data.ui === "declined" || data.ui === "expired") {
          clearPendingFriendInvite()
          stopInterval()
          return
        }
          if (data.ui === "accepted" && data.preset) {
          const snap = readPendingFriendInvite(player.id)
          if (!snap || snap.inviteId !== pending.inviteId) return
          stopInterval()
            await runAccepted(snap, data.preset)
        }
      } catch {
        /* сеть */
      }
    }

    const startLoop = () => {
      stopInterval()
      if (cancelled) return
      if (["arena", "matchmaking", "result"].includes(screenRef.current)) return
      if (!readPendingFriendInvite(player.id)) return
      void pollOnce()
      intervalId = setInterval(pollOnce, POLL_MS)
    }

    startLoop()
    const onPendingEvent = () => startLoop()
    window.addEventListener("rps-pending-friend-invite", onPendingEvent)

    return () => {
      cancelled = true
      stopInterval()
      window.removeEventListener("rps-pending-friend-invite", onPendingEvent)
    }
  }, [
    player.id,
    screen,
    setCurrentBet,
    setOfflineMode,
    setOpponent,
    setPvpMatchId,
    setPlayer,
    setScreen,
    setTotalRounds,
  ])

  return null
}
