"use client"

import { useCallback, useMemo, useState } from "react"
import { appPath } from "@/lib/app-path"
import { useGame } from "@/lib/game-context"
import { ArrowLeft, Users, Loader2, Swords } from "lucide-react"
import { showFriendsPicker, isVKEnvironment, sendGameInviteToVkFriend, type VKFriend } from "@/lib/vk-bridge"
import { TOURNAMENT_INVITE_BET_OPTIONS } from "@/lib/play-invite-preset"
import { formatAmount } from "@/lib/format-amount"
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

function roundsLabel(r: 1 | 3 | 5): string {
  if (r === 1) return "1 ход"
  if (r === 3) return "3 хода"
  return "5 ходов"
}

export function FriendsInGameScreen() {
  const { player, setScreen, toDisplayAmount, currencyLabel } = useGame()
  const [friends, setFriends] = useState<FriendRow[]>([])
  const [pickLoading, setPickLoading] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteTarget, setInviteTarget] = useState<FriendRow | null>(null)
  const [roundsChoice, setRoundsChoice] = useState<1 | 3 | 5>(3)
  const [betChoice, setBetChoice] = useState<number>(25)
  const [sendLoading, setSendLoading] = useState(false)
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  const betOptionsForRounds = useMemo(
    () => TOURNAMENT_INVITE_BET_OPTIONS.filter((o) => o.rounds === roundsChoice),
    [roundsChoice],
  )

  const canUse = player.id.startsWith("vk_")

  const mergePhotos = useCallback((rows: FriendRow[], vkUsers: VKFriend[]) => {
    const photoById = new Map(vkUsers.map((u) => [u.id, u.photo_200]))
    return rows.map((r) => ({
      ...r,
      photo_200: photoById.get(r.vkId) ?? r.photo_200,
    }))
  }, [])

  const handlePickFriends = async () => {
    if (!canUse) return
    setPickLoading(true)
    setBanner(null)
    try {
      const users = await showFriendsPicker()
      if (!users?.length) return
      const ids = users.map((u) => u.id)
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
      if (!data.ok) {
        setFriends([])
        setBanner({ kind: "err", text: "Не удалось проверить список. Попробуйте позже." })
        return
      }
      if (!data.friends?.length) {
        setFriends([])
        setBanner({
          kind: "err",
          text: "Среди выбранных никто ещё не заходил в игру. Попробуйте других или пригласите в приложение.",
        })
        return
      }
      const merged = mergePhotos(
        data.friends.map((f) => ({ ...f })),
        users,
      )
      setFriends(merged)
      setBanner({
        kind: "ok",
        text: `В игре: ${merged.length} из ${users.length} выбранных.`,
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
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!data.ok) {
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
      setInviteOpen(false)
      setInviteTarget(null)
      setBanner({
        kind: "ok",
        text: `Приглашение отправлено: ${roundsLabel(rounds)}, ставка ${formatAmount(toDisplayAmount(bet))} ${currencyLabel}.`,
      })
      if (isVKEnvironment()) {
        try {
          await sendGameInviteToVkFriend(
            target.vkId,
            `Приглашение в турнир: ${roundsLabel(rounds)}, ставка ${bet} монет.`,
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
          <h1 className="text-lg font-bold text-white">Друзья в игре</h1>
        </div>
      </div>

      <p className="text-sm text-white/80 mb-4 leading-relaxed">
        Выберите друзей ВКонтакте — мы покажем, у кого уже есть профиль в RPS Arena. Отправьте внутриигровое приглашение
        к турниру и укажите число ходов и ставку.
      </p>

      {!canUse && (
        <p className="text-sm text-amber-200/90 mb-4 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2">
          Раздел доступен после входа через ВКонтакте.
        </p>
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

      <Button
        type="button"
        className="w-full mb-6 gap-2"
        disabled={!canUse || pickLoading}
        onClick={() => void handlePickFriends()}
      >
        {pickLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
        {pickLoading ? "Загрузка…" : "Выбрать друзей ВК и проверить"}
      </Button>

      {friends.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">Играют в RPS Arena</p>
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
                <Swords className="h-3.5 w-3.5" /> Турнир
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={(o) => !o && setInviteOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Приглашение к турниру</DialogTitle>
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
