"use client"

import { useCallback, useEffect, useMemo, useReducer, useState } from "react"
import { appPath } from "@/lib/app-path"
import { useGame } from "@/lib/game-context"
import { ArrowLeft, Users, Loader2, Swords, Clock, RefreshCw, Hourglass } from "lucide-react"
import { showFriendsPicker, isVKEnvironment, sendGameInviteToVkFriend, type VKFriend } from "@/lib/vk-bridge"
import { TOURNAMENT_INVITE_BET_OPTIONS } from "@/lib/play-invite-preset"
import { formatAmount } from "@/lib/format-amount"
import {
  readPendingFriendInvite,
  writePendingFriendInvite,
  readFriendsInGameList,
  writeFriendsInGameList,
  type PendingFriendInviteSnapshot,
} from "@/lib/friend-invite-pending"
import {
  PENDING_VK_APP_INVITES_KEY,
  type PendingAppInviteEntry,
  parsePendingAppPayload,
  writePendingAppInvitesToLS,
  syncPendingEntriesAfterPick,
} from "@/lib/pending-vk-app-invites"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PlayerAvatar } from "@/components/player-avatar"

type FriendRow = {
  playerId: string
  vkId: number
  name: string
  wins: number
  photo_200?: string
}

function isFriendRow(x: unknown): x is FriendRow {
  if (!x || typeof x !== "object") return false
  const o = x as Record<string, unknown>
  return (
    typeof o.playerId === "string" &&
    typeof o.vkId === "number" &&
    typeof o.name === "string" &&
    typeof o.wins === "number"
  )
}

function roundsLabel(r: 1 | 3 | 5): string {
  if (r === 1) return "1 ход"
  if (r === 3) return "3 хода"
  return "5 ходов"
}

export function FriendsInGameScreen() {
  const { player, setScreen, toDisplayAmount, currencyLabel } = useGame()
  const [, bumpPendingUi] = useReducer((n: number) => n + 1, 0)
  const [friends, setFriends] = useState<FriendRow[]>([])
  const [pickLoading, setPickLoading] = useState(false)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteTarget, setInviteTarget] = useState<FriendRow | null>(null)
  const [roundsChoice, setRoundsChoice] = useState<1 | 3 | 5>(3)
  const [betChoice, setBetChoice] = useState<number>(25)
  const [sendLoading, setSendLoading] = useState(false)
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null)
  const [pendingFromPicker, setPendingFromPicker] = useState<PendingAppInviteEntry[]>([])

  const refreshPendingFromLS = useCallback(() => {
    setPendingFromPicker(parsePendingAppPayload(localStorage.getItem(PENDING_VK_APP_INVITES_KEY))?.entries ?? [])
  }, [])

  const betOptionsForRounds = useMemo(
    () => TOURNAMENT_INVITE_BET_OPTIONS.filter((o) => o.rounds === roundsChoice),
    [roundsChoice],
  )

  const canUse = player.id.startsWith("vk_")
  const pendingSnap: PendingFriendInviteSnapshot | null = canUse ? readPendingFriendInvite(player.id) : null

  useEffect(() => {
    const fn = () => bumpPendingUi()
    window.addEventListener("rps-pending-friend-invite", fn)
    return () => window.removeEventListener("rps-pending-friend-invite", fn)
  }, [])

  useEffect(() => {
    if (!canUse) return
    let cancelled = false
    const mergeFriends = (a: FriendRow[], b: FriendRow[]): FriendRow[] => {
      const m = new Map<string, FriendRow>()
      for (const r of a) m.set(r.playerId, r)
      for (const r of b) {
        const ex = m.get(r.playerId)
        m.set(r.playerId, ex ? { ...ex, ...r, photo_200: r.photo_200 ?? ex.photo_200 } : r)
      }
      return Array.from(m.values())
    }
    const run = async () => {
      let serverRows: FriendRow[] = []
      try {
        const res = await fetch(
          appPath(`/api/friends-in-game/saved-list?userId=${encodeURIComponent(player.id)}`),
          { cache: "no-store" },
        )
        const data = (await res.json()) as { ok?: boolean; friends?: unknown[] }
        if (data.ok && Array.isArray(data.friends)) serverRows = data.friends.filter(isFriendRow)
      } catch {
        /* офлайн / статический экспорт */
      }
      if (cancelled) return
      // Важно: читаем sessionStorage после await — иначе гонка с выбором друзей
      // (пустой снимок перетирает несколько только что добавленных строк).
      const localRows = (readFriendsInGameList(player.id) ?? []).filter(isFriendRow)
      const merged = mergeFriends(serverRows, localRows)
      if (merged.length) {
        setFriends(merged)
        writeFriendsInGameList(player.id, merged)
      } else if (localRows.length) {
        setFriends(localRows)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [canUse, player.id])

  useEffect(() => {
    if (!canUse) return
    refreshPendingFromLS()
  }, [canUse, player.id, refreshPendingFromLS])

  useEffect(() => {
    if (!canUse) return
    const payload = parsePendingAppPayload(localStorage.getItem(PENDING_VK_APP_INVITES_KEY))
    if (!payload?.entries.length) return
    const inGame = new Set(friends.map((f) => f.vkId))
    const next = payload.entries.filter((e) => !inGame.has(e.vkId))
    if (next.length === payload.entries.length) return
    writePendingAppInvitesToLS(next, payload.createdAt)
    setPendingFromPicker(next)
  }, [canUse, friends])

  const invitedSlotRows = useMemo((): PendingAppInviteEntry[] => {
    if (!Array.isArray(player.invitedFriends)) return []
    const out: PendingAppInviteEntry[] = []
    for (const x of player.invitedFriends) {
      if (!x || typeof x.id !== "number" || !Number.isInteger(x.id) || x.id <= 0) continue
      const name = `${x.first_name} ${x.last_name}`.trim() || `Друг ВК (${x.id})`
      out.push({ vkId: x.id, name, photo_200: x.photo_200?.length ? x.photo_200 : undefined })
    }
    return out
  }, [player.invitedFriends])

  const waitingInviteRows = useMemo(() => {
    const inGameVk = new Set(friends.map((f) => f.vkId))
    const byVk = new Map<number, PendingAppInviteEntry>()
    for (const e of invitedSlotRows) {
      if (inGameVk.has(e.vkId)) continue
      byVk.set(e.vkId, e)
    }
    for (const e of pendingFromPicker) {
      if (inGameVk.has(e.vkId)) continue
      const prev = byVk.get(e.vkId)
      byVk.set(e.vkId, {
        vkId: e.vkId,
        name: e.name || prev?.name || `Друг ВК (${e.vkId})`,
        photo_200: e.photo_200 ?? prev?.photo_200,
      })
    }
    return Array.from(byVk.values())
  }, [friends, invitedSlotRows, pendingFromPicker])

  // Авто-подтягиваем друзей, которые уже вошли в RPS Arena,
  // если мы ранее отправляли им приглашение в приложение (за монеты).
  useEffect(() => {
    if (!canUse) return

    const idsFromInvitedSlots = (() => {
      if (!Array.isArray(player.invitedFriends)) return []
      const vkIds = player.invitedFriends
        .filter((x): x is { id: number } & NonNullable<typeof x> => Boolean(x) && typeof (x as any).id === "number")
        .map((x) => x.id)
        .filter((n) => Number.isFinite(n) && n > 0)
      // Ограничиваем размер запроса
      return vkIds.slice(0, 80)
    })()

    const pendingPayload = parsePendingAppPayload(localStorage.getItem(PENDING_VK_APP_INVITES_KEY))
    const idsFromPending = pendingPayload?.entries.map((e) => e.vkId) ?? []

    const idsToCheck = Array.from(new Set([...idsFromPending, ...idsFromInvitedSlots])).slice(0, 80)
    if (!idsToCheck.length) return

    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch(appPath("/api/friends-in-game/lookup"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ userId: player.id, friendVkIds: idsToCheck }),
        })
        const data = (await res.json()) as {
          ok?: boolean
          friends?: { playerId: string; vkId: number; name: string; wins: number }[]
        }
        if (cancelled) return
        if (!data.ok || !data.friends?.length) return

        const newRows: FriendRow[] = data.friends
          .filter(
            (f) =>
              typeof f.playerId === "string" && typeof f.vkId === "number" && typeof f.name === "string",
          )
          .map((f) => ({
            playerId: f.playerId,
            vkId: f.vkId,
            name: f.name,
            wins: typeof f.wins === "number" ? f.wins : 0,
          }))

        if (!newRows.length) return

        setFriends((prev) => {
          const byId = new Map(prev.map((x) => [x.playerId, x]))
          for (const r of newRows) {
            const existing = byId.get(r.playerId)
            byId.set(r.playerId, existing ? { ...existing, ...r, photo_200: existing.photo_200 } : r)
          }
          return Array.from(byId.values())
        })

        if (pendingPayload?.entries.length && data.friends?.length) {
          const foundVkIds = new Set(data.friends.map((f) => f.vkId))
          const remaining = pendingPayload.entries.filter((e) => !foundVkIds.has(e.vkId))
          writePendingAppInvitesToLS(remaining, pendingPayload.createdAt)
          setPendingFromPicker(remaining)
        }
      } catch {
        /* ignore */
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [canUse, player.id, player.invitedFriends, pendingFromPicker])

  useEffect(() => {
    if (!canUse || friends.length === 0) return
    writeFriendsInGameList(player.id, friends)
  }, [canUse, player.id, friends])

  const mergePhotos = useCallback((rows: FriendRow[], vkUsers: VKFriend[]) => {
    const photoById = new Map(vkUsers.map((u) => [u.id, u.photo_200]))
    return rows.map((r) => ({
      ...r,
      photo_200: photoById.get(r.vkId) ?? r.photo_200,
    }))
  }, [])

  const mergeFriendRows = useCallback((a: FriendRow[], b: FriendRow[]): FriendRow[] => {
    const m = new Map<string, FriendRow>()
    for (const r of a) m.set(r.playerId, r)
    for (const r of b) {
      const ex = m.get(r.playerId)
      m.set(r.playerId, ex ? { ...ex, ...r, photo_200: r.photo_200 ?? ex.photo_200 } : r)
    }
    return Array.from(m.values())
  }, [])

  const handleRefreshList = async () => {
    if (!canUse || refreshLoading || pickLoading) return
    setRefreshLoading(true)
    setBanner(null)
    try {
      let serverRows: FriendRow[] = []
      try {
        const res = await fetch(
          appPath(`/api/friends-in-game/saved-list?userId=${encodeURIComponent(player.id)}`),
          { cache: "no-store" },
        )
        const d = (await res.json()) as { ok?: boolean; friends?: unknown[] }
        if (d.ok && Array.isArray(d.friends)) serverRows = d.friends.filter(isFriendRow)
      } catch {
        /* ignore */
      }

      let merged = mergeFriendRows(serverRows, friends)

      const idSet = new Set<number>()
      for (const r of merged) {
        if (Number.isInteger(r.vkId) && r.vkId > 0) idSet.add(r.vkId)
      }
      if (Array.isArray(player.invitedFriends)) {
        for (const x of player.invitedFriends) {
          if (x && typeof (x as { id?: unknown }).id === "number") {
            const id = (x as { id: number }).id
            if (Number.isInteger(id) && id > 0) idSet.add(id)
          }
        }
      }
      const pend = parsePendingAppPayload(localStorage.getItem(PENDING_VK_APP_INVITES_KEY))
      if (pend?.entries.length) {
        for (const e of pend.entries) idSet.add(e.vkId)
      }
      const snap = readPendingFriendInvite(player.id)
      if (snap?.friend?.vkId && snap.friend.vkId > 0) idSet.add(snap.friend.vkId)

      const mergedIds = Array.from(idSet).slice(0, 80)
      if (mergedIds.length) {
        const res = await fetch(appPath("/api/friends-in-game/lookup"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ userId: player.id, friendVkIds: mergedIds }),
        })
        const data = (await res.json()) as {
          ok?: boolean
          friends?: { playerId: string; vkId: number; name: string; wins: number }[]
        }
        if (data.ok && data.friends?.length) {
          const newRows: FriendRow[] = data.friends
            .filter(
              (f) =>
                typeof f.playerId === "string" &&
                typeof f.vkId === "number" &&
                typeof f.name === "string",
            )
            .map((f) => ({
              playerId: f.playerId,
              vkId: f.vkId,
              name: f.name,
              wins: typeof f.wins === "number" ? f.wins : 0,
            }))
          merged = mergeFriendRows(merged, newRows)
        }
      }

      setFriends(merged)
      writeFriendsInGameList(player.id, merged)
      setBanner({
        kind: "ok",
        text: "Список обновлён — подтянуты сохранённые друзья и те, кто уже заходил в игру.",
      })
    } catch {
      setBanner({ kind: "err", text: "Не удалось обновить. Попробуйте позже." })
    } finally {
      setRefreshLoading(false)
    }
  }

  const handlePickFriends = async () => {
    if (!canUse) return
    setPickLoading(true)
    setBanner(null)
    try {
      const users = await showFriendsPicker()
      if (!users?.length) return
      const ids = users.map((u) => u.id)

      // Приглашение в мини-приложение через ВК (как в магазине / подсказке с балансом).
      // Раньше после выбора друзей не вызывался Bridge — друг не получал уведомление.
      let vkInvitesAttempted = false
      if (isVKEnvironment()) {
        vkInvitesAttempted = true
        const inviteMsg = "Заходи в RPS Arena — камень, ножницы, бумага с друзьями и турниры."
        for (const u of users) {
          try {
            await sendGameInviteToVkFriend(u.id, inviteMsg)
          } catch {
            /* Bridge / пользователь закрыл окно */
          }
        }
      }

      const res = await fetch(appPath("/api/friends-in-game/lookup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ userId: player.id, friendVkIds: ids }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        friends?: { playerId: string; vkId: number; name: string; wins: number }[]
      }
      const inGameList = data.ok && Array.isArray(data.friends) ? data.friends : []

      if (data.ok) {
        syncPendingEntriesAfterPick(users, inGameList)
        refreshPendingFromLS()
      }

      if (!data.ok) {
        setBanner({
          kind: "err",
          text: vkInvitesAttempted
            ? "Список на сервере не обновился. Если открывалось окно ВК — приглашения могли уйти. Попробуйте позже."
            : "Не удалось проверить список. Попробуйте позже.",
        })
        return
      }
      if (!inGameList.length) {
        setBanner(
          vkInvitesAttempted
            ? {
                kind: "ok",
                text: "Приглашения в приложение отправлены выбранным друзьям. Они отображаются ниже со статусом «Ожидание», пока не зайдут в RPS Arena.",
              }
            : {
                kind: "err",
                text: "Среди выбранных никто ещё не заходил в игру. Список ожидания сохранён — как только зайдут, обновите список.",
              },
        )
        return
      }
      const mergedFromPicker = mergePhotos(
        inGameList.map((f) => ({ ...f })),
        users,
      )
      setFriends((prev) => {
        const next = mergeFriendRows(prev, mergedFromPicker)
        writeFriendsInGameList(player.id, next)
        return next
      })
      const inGame = inGameList.length
      const total = users.length
      setBanner({
        kind: "ok",
        text:
          vkInvitesAttempted && inGame < total
            ? `В игре: ${inGame} из ${total}. Остальным отправлено приглашение в приложение ВК. Можно пригласить в турнир тех, кто уже в игре.`
            : `В игре: ${inGame} из ${total} выбранных. Можно пригласить в турнир в любой момент.`,
      })
    } finally {
      setPickLoading(false)
    }
  }

  const openInvite = (row: FriendRow) => {
    setInviteTarget(row)
    setRoundsChoice(3)
    setBetChoice(25)
    setInviteOpen(true)
  }

  const handleRoundsChange = (r: 1 | 3 | 5) => {
    setRoundsChoice(r)
    const first = TOURNAMENT_INVITE_BET_OPTIONS.find((o) => o.rounds === r)
    if (first) setBetChoice(first.value)
  }

  const sendInvite = async () => {
    if (!inviteTarget || !canUse) return
    const target = inviteTarget
    const rounds = roundsChoice
    const bet = betChoice
    setSendLoading(true)
    setBanner(null)
    try {
      const res = await fetch(appPath("/api/play-invite/create-friend"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          fromUserId: player.id,
          toUserId: target.playerId,
          bet,
          rounds,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; inviteId?: string; error?: string }
      if (!data.ok || !data.inviteId) {
        const msg =
          data.error === "insufficient_balance"
            ? "Недостаточно монет на сервере для этой ставки (синхронизируйте прогресс или выберите меньше)."
            : data.error === "opponent_insufficient_balance"
              ? "У друга недостаточно монет на сервере для этой ставки — выберите меньше или попросите пополнить баланс."
              : data.error === "already_pending"
                ? "Уже есть активное приглашение этому игроку."
                : data.error === "player_not_found"
                  ? "Профиль друга не найден."
                  : "Не удалось отправить приглашение."
        setBanner({ kind: "err", text: msg })
        return
      }
      const snapshot: PendingFriendInviteSnapshot = {
        inviteId: data.inviteId,
        fromUserId: player.id,
        friend: {
          playerId: target.playerId,
          vkId: target.vkId,
          name: target.name,
          wins: target.wins,
          photo_200: target.photo_200,
        },
      }
      writePendingFriendInvite(snapshot)
      setInviteOpen(false)
      setInviteTarget(null)
      setBanner({
        kind: "ok",
        text: `Приглашение отправлено: ${roundsLabel(rounds)}, ставка ${formatAmount(toDisplayAmount(bet))} ${currencyLabel}. Как только друг примет — начнётся матч на двоих. Список друзей сохранён — можно приглашать снова.`,
      })
      if (isVKEnvironment()) {
        try {
          await sendGameInviteToVkFriend(
            target.vkId,
            `Приглашение в турнир: ${roundsLabel(rounds)}, ставка ${bet} монет. Откройте игру, чтобы принять.`,
          )
        } catch {
          /* опциональное уведомление ВК */
        }
      }
    } finally {
      setSendLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full max-w-lg mx-auto px-4 py-6 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => setScreen("menu")}
          className="p-2 rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10"
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-sky-400" />
          <h1 className="text-lg font-bold text-white">С друзьями</h1>
        </div>
      </div>

      <p className="text-sm text-white/80 mb-4 leading-relaxed">
        Выберите друзей из ВК — увидите, у кого уже есть профиль в RPS Arena. В любой момент отправляйте приглашение к
        турниру на двоих (вы и друг). После принятия откроется бой на выбранное число ходов и ставку.
      </p>

      {!canUse && (
        <p className="text-sm text-amber-200/90 mb-4 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2">
          Раздел доступен после входа через ВКонтакте.
        </p>
      )}

      {pendingSnap && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-sky-400/45 bg-sky-500/15 px-3 py-2.5 text-sm text-sky-100">
          <Clock className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Ждём ответа друга</p>
            <p className="text-xs text-sky-200/85 mt-0.5">
              {pendingSnap.friend.name}: как только примет приглашение в игре, начнётся матч. Можете вернуться в меню —
              ожидание продолжится в фоне.
            </p>
          </div>
        </div>
      )}

      {banner && (
        <div
          className={`mb-4 text-sm rounded-xl px-3 py-2 ${
            banner.kind === "ok"
              ? "bg-emerald-500/15 border border-emerald-400/40 text-emerald-100"
              : "bg-red-500/15 border border-red-400/45 text-red-100"
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="flex gap-2 mb-6 w-full">
        <Button
          type="button"
          className="flex-1 min-w-0 gap-2"
          disabled={!canUse || pickLoading || refreshLoading}
          onClick={() => void handlePickFriends()}
        >
          {pickLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          {pickLoading ? "Загрузка…" : "Выбрать друзей ВК и обновить список"}
        </Button>
        <button
          type="button"
          onClick={() => void handleRefreshList()}
          disabled={!canUse || pickLoading || refreshLoading}
          className="shrink-0 h-11 w-11 rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 flex items-center justify-center"
          aria-label="Обновить список друзей"
          title="Обновить список"
        >
          <RefreshCw className={`h-5 w-5 ${refreshLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {friends.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">В игре (список сохраняется)</p>
          {friends.map((f) => (
            <div
              key={f.playerId}
              className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 px-3 py-3"
            >
              <div className="relative h-11 w-11 rounded-full overflow-hidden border border-white/20 shrink-0">
                {f.photo_200 ? (
                  <img src={f.photo_200} alt="" className="h-full w-full object-cover" />
                ) : (
                  <PlayerAvatar name={f.name} avatar={f.name.charAt(0)} size="sm" variant="muted" vip={false} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{f.name}</p>
                <p className="text-xs text-white/55">{f.wins} побед</p>
              </div>
              <button
                type="button"
                onClick={() => openInvite(f)}
                className="flex items-center gap-1.5 shrink-0 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3 py-2"
              >
                <Swords className="h-3.5 w-3.5" /> В турнир
              </button>
            </div>
          ))}
        </div>
      )}

      {waitingInviteRows.length > 0 && (
        <div className={`flex flex-col gap-2 ${friends.length > 0 ? "mt-6" : ""}`}>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">Приглашены в приложение</p>
          {waitingInviteRows.map((e) => (
            <div
              key={e.vkId}
              className="flex items-center gap-3 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-3 py-3"
            >
              <div className="relative h-11 w-11 rounded-full overflow-hidden border border-white/20 shrink-0">
                {e.photo_200 ? (
                  <img src={e.photo_200} alt="" className="h-full w-full object-cover" />
                ) : (
                  <PlayerAvatar name={e.name} avatar={e.name.charAt(0)} size="sm" variant="muted" vip={false} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{e.name}</p>
                <p className="text-xs text-amber-200/90 flex items-center gap-1.5 mt-0.5">
                  <Hourglass className="h-3.5 w-3.5 shrink-0 opacity-90" />
                  Ожидание — ещё не заходили в игру
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={(o) => !o && setInviteOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Приглашение к турниру (1 на 1)</DialogTitle>
          </DialogHeader>
          {inviteTarget && (
            <p className="text-sm text-muted-foreground">
              Игрок: <span className="font-semibold text-foreground">{inviteTarget.name}</span>
            </p>
          )}
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Количество ходов</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {([1, 3, 5] as const).map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-2 cursor-pointer rounded-xl border px-3 py-2 text-sm ${
                      roundsChoice === r ? "border-primary bg-primary/15" : "border-border/60"
                    }`}
                  >
                    <input
                      type="radio"
                      className="accent-primary"
                      checked={roundsChoice === r}
                      onChange={() => handleRoundsChange(r)}
                    />
                    {roundsLabel(r)}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Ставка ({currencyLabel})</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {betOptionsForRounds.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setBetChoice(o.value)}
                    className={`rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                      betChoice === o.value
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border/50 bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    {formatAmount(toDisplayAmount(o.value))}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
              Отмена
            </Button>
            <Button type="button" disabled={sendLoading} onClick={() => void sendInvite()}>
              {sendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Отправить приглашение"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
