"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react"
import { initVKBridge, getVKUser, getBridgeReady, type VKUser } from "@/lib/vk-bridge"
import {
  parseVKHashFragment,
  fetchVKUserByToken,
  saveVKOAuthSession,
  getStoredVKOAuthSession,
  clearVKOAuthSession,
} from "@/lib/vk-oauth"

export type Move = "rock" | "scissors" | "paper" | "water"
export type GameScreen =
  | "entry"
  | "menu"
  | "bet-select"
  | "matchmaking"
  | "arena"
  | "result"
  | "leaderboard"
  | "profile"
  | "shop"
  | "withdraw"
  | "bets"

export interface Player {
  id: string
  name: string
  avatar: string
  avatarUrl: string
  balance: number
  wins: number
  losses: number
  weekWins: number
  weekEarnings: number
  vip: boolean
  /** Осталось матчей с приоритетом поиска (покупка «Быстрый поиск») */
  fastMatchBoosts?: number
  /** Анимация при победе: "fire" и т.д. */
  victoryAnimation?: string
  /** Скин карт: "gold" и т.д. */
  cardSkin?: string
  /** Рамка аватара: "neon" и т.д. */
  avatarFrame?: string
  /** Участие в турнире дня */
  tournamentEntry?: boolean
  /** Скрыть аватар из ВК (купили за 100 голосов) */
  hideVkAvatar?: boolean
  /** Карта «Лава»: осталось использований (5 за покупку) */
  lavaCardUses?: number
  /** Карта «Вода»: осталось использований (3 за покупку). Побеждает камень, проигрывает бумаге, ничья с ножницами. */
  waterCardUses?: number
  /** Приглашённые друзья (до 4 слотов). Когда друг принимает приглашение — появляется в ячейке. */
  invitedFriends?: Array<{ id: number; first_name: string; last_name: string; photo_200: string } | null>
  /** Награда 100 голосов за 4 приглашённых друга уже получена */
  invitedRewardClaimed?: boolean
  /** Награда 100 голосов за пост «расскажи друзьям» уже получена */
  wallPostRewardClaimed?: boolean
  /** Время последнего получения ежедневного подарка (timestamp). Следующий доступен через 24 ч. */
  lastDailyGiftClaimedAt?: number
  /** Индекс текущего дня в цепочке ежедневных наград (0..6). */
  dailyRewardIndex?: number
}

export interface LeaderboardEntry {
  rank: number
  id: string
  name: string
  avatar: string
  avatarUrl: string
  wins: number
  earnings: number
  vip: boolean
  isPlayer?: boolean
}

/** Режим ставки: разово (удаляется после игры) или держать 1 час */
export type BetDuration = "once" | "1h"

/** URL аватарки робота — фото живых людей (RandomUser), один seed → одно и то же лицо */
export const BOT_AVATAR_URL = (seed: string) => {
  const num = parseInt(seed.replace(/\D/g, ""), 10) || 0
  const portraitId = (num % 99) + 1
  const gender = num % 2 ? "women" : "men"
  return `https://randomuser.me/api/portraits/${gender}/${portraitId}.jpg`
}

/** Ставка от другого игрока или своя (в списке) */
export interface BetEntry {
  id: string
  creatorId: string
  creatorName: string
  creatorAvatar: string
  creatorWins: number
  amount: number
  createdAt: number
  /** Если задано — ставка скрывается после этого времени (режим «1 час») */
  expiresAt?: number
  /** ВИП-игрок — такие ставки всегда сверху */
  vip?: boolean
  /** Имитация жизни: ставка робота исчезает в этот момент (рандом ~15 сек от появления) */
  botExpiresAt?: number
  /** Аватарка создателя (для роботов — картинка, для своих — не задаётся) */
  creatorAvatarUrl?: string
}

/** Созданная пользователем ставка в ожидании отклика */
export interface PendingBet {
  id: string
  amount: number
  createdAt: number
}

/** Отклик на ставку — показать модалку принять/отклонить */
export interface BetResponse {
  id: string
  betId: string
  responderId: string
  responderName: string
  responderAvatar: string
  responderWins: number
  amount: number
}

export interface MatchResult {
  playerMove: Move | null
  opponentMove: Move | null
  outcome: "win" | "loss" | "draw"
  earnings: number
  bet: number
}

interface GameState {
  screen: GameScreen
  setScreen: (s: GameScreen) => void
  player: Player
  setPlayer: React.Dispatch<React.SetStateAction<Player>>
  opponent: Player | null
  setOpponent: React.Dispatch<React.SetStateAction<Player | null>>
  currentBet: number
  setCurrentBet: (b: number) => void
  lastResult: MatchResult | null
  setLastResult: React.Dispatch<React.SetStateAction<MatchResult | null>>
  leaderboard: LeaderboardEntry[]
  playerRank: number
  /** Тренд рейтинга: вырос — зелёный, упал — красный */
  rankTrend: "up" | "down" | null
  leaderboardVersion: number
  /** Покупка буста рейтинга: 250 голосов → +100 к недельным очкам */
  purchaseRankBoost: () => boolean
  vkUser: VKUser | null
  /** Войти через ВК: авторизация, привязка профиля, после этого можно играть и выводить деньги */
  loginWithVK: () => Promise<void>
  /** Выйти из аккаунта ВК — возврат на экран входа */
  logoutWithVK: () => void
  isLoading: boolean
  bets: BetEntry[]
  pendingBet: PendingBet | null
  betResponse: BetResponse | null
  createBet: (amount: number, duration?: BetDuration) => void
  removeBet: (betId: string) => void
  /** Изменить размер активной ставки (только если есть pendingBet) */
  updatePendingBetAmount: (newAmount: number) => boolean
  acceptBetResponse: () => void
  declineBetResponse: () => void
  clearPendingBet: () => void
  /** Количество ходов в матче: 1 (быстрая игра), 3 или 5 */
  totalRounds: 1 | 3 | 5
  setTotalRounds: (n: 1 | 3 | 5) => void
  /** Лимит вывода: от 200 на балансе, не более 10 000 в день */
  withdrawState: { date: string; amount: number }
  recordWithdraw: (amount: number) => void
  /** Горячая новинка: карта «Лава», остаток в наличии (3 штуки всего) */
  lavaCardStock: number
  purchaseLavaCard: () => boolean
  purchaseWaterCard: () => boolean
}

const GameContext = createContext<GameState | null>(null)

/** 50 ботов для матчей, ставок и рейтинга: русские имена + имена стран СНГ */
const BOT_NAMES: { name: string; avatar: string; vip: boolean }[] = [
  { name: "Алексей", avatar: "А", vip: false },
  { name: "Мария", avatar: "М", vip: true },
  { name: "Дмитрий", avatar: "Д", vip: false },
  { name: "Оксана", avatar: "О", vip: true },
  { name: "Никита", avatar: "Н", vip: false },
  { name: "Ольга", avatar: "О", vip: true },
  { name: "Сергей", avatar: "С", vip: false },
  { name: "Анна", avatar: "А", vip: false },
  { name: "Тарас", avatar: "Т", vip: false },
  { name: "Елена", avatar: "Е", vip: false },
  { name: "Нурлан", avatar: "Н", vip: false },
  { name: "Татьяна", avatar: "Т", vip: true },
  { name: "Асель", avatar: "А", vip: false },
  { name: "Наталья", avatar: "Н", vip: false },
  { name: "Михаил", avatar: "М", vip: false },
  { name: "Юлия", avatar: "Ю", vip: true },
  { name: "Ерлан", avatar: "Е", vip: false },
  { name: "Светлана", avatar: "С", vip: false },
  { name: "Александр", avatar: "А", vip: true },
  { name: "Динара", avatar: "Д", vip: true },
  { name: "Роман", avatar: "Р", vip: false },
  { name: "Виктория", avatar: "В", vip: false },
  { name: "Артём", avatar: "А", vip: false },
  { name: "Нигора", avatar: "Н", vip: false },
  { name: "Максим", avatar: "М", vip: true },
  { name: "Рустам", avatar: "Р", vip: false },
  { name: "Кирилл", avatar: "К", vip: false },
  { name: "Алина", avatar: "А", vip: false },
  { name: "Армен", avatar: "А", vip: false },
  { name: "Валерия", avatar: "В", vip: true },
  { name: "Егор", avatar: "Е", vip: false },
  { name: "Лусине", avatar: "Л", vip: false },
  { name: "Даниил", avatar: "Д", vip: false },
  { name: "Марина", avatar: "М", vip: false },
  { name: "Георгий", avatar: "Г", vip: false },
  { name: "София", avatar: "С", vip: true },
  { name: "Николай", avatar: "Н", vip: false },
  { name: "Нино", avatar: "Н", vip: false },
  { name: "Станислав", avatar: "С", vip: false },
  { name: "Эльдар", avatar: "Э", vip: false },
  { name: "Глеб", avatar: "Г", vip: false },
  { name: "Севиль", avatar: "С", vip: false },
  { name: "Фёдор", avatar: "Ф", vip: false },
  { name: "Олеся", avatar: "О", vip: false },
  { name: "Лев", avatar: "Л", vip: true },
  { name: "Янина", avatar: "Я", vip: false },
  { name: "Захар", avatar: "З", vip: false },
  { name: "Айдай", avatar: "А", vip: false },
  { name: "Богдан", avatar: "Б", vip: false },
  { name: "Регина", avatar: "Р", vip: false },
]

/** Детерминированные значения по индексу (без Math.random/Date.now), чтобы SSR и клиент совпадали при гидратации */
function buildBots(): Player[] {
  return BOT_NAMES.map((b, i) => {
    const id = `bot-${i}`
    const wins = 10 + (i * 17) % 90
    return {
      id,
      name: b.name,
      avatar: b.avatar,
      avatarUrl: BOT_AVATAR_URL(id),
      balance: 300 + (i * 37) % 1000,
      wins,
      losses: 5 + (i * 11) % 50,
      weekWins: Math.floor(wins / 3),
      weekEarnings: 50 + (i * 23) % 400,
      vip: b.vip,
    }
  })
}

function buildLeaderboardFromBots(bots: Player[]): Omit<LeaderboardEntry, "rank">[] {
  return bots.map((b, i) => ({
    id: `lb-${b.id}`,
    name: b.name,
    avatar: b.avatar,
    avatarUrl: b.avatarUrl,
    wins: b.wins + (i * 7) % 20,
    earnings: b.weekEarnings * 8 + (i * 13) % 500,
    vip: b.vip,
  }))
}

/** Базовая метка времени для createdAt (фиксированная, чтобы не ломать гидратацию) */
const MOCK_BETS_BASE_TIME = 1000000000000

function buildMockBetsFromBots(bots: Player[]): BetEntry[] {
  return bots.slice(0, 20).map((b, i) => ({
    id: `bet-${b.id}-${i}`,
    creatorId: b.id,
    creatorName: b.name,
    creatorAvatar: b.avatar,
    creatorAvatarUrl: b.avatarUrl,
    creatorWins: b.wins,
    amount: [25, 50, 100, 150, 200][i % 5],
    createdAt: MOCK_BETS_BASE_TIME - (i + 1) * 60000,
    vip: b.vip,
  }))
}

const OPPONENTS = buildBots()
const STATIC_LEADERBOARD = buildLeaderboardFromBots(OPPONENTS)
const MOCK_BETS = buildMockBetsFromBots(OPPONENTS)

/** В блоке ставок всегда показывать минимум столько слотов; недостающее заполнять роботами */
export const MIN_BETS_DISPLAY = 10

const BET_AMOUNTS = [25, 50, 100, 150, 200]

/** Генерирует доп. ставки роботов для отображения (только для списка, не в state). */
export function getFillerBetEntries(count: number): BetEntry[] {
  if (count <= 0) return []
  const base = Date.now()
  return Array.from({ length: count }, (_, i) => {
    const bot = OPPONENTS[i % OPPONENTS.length]
    return {
      id: `filler-${i}-${bot.id}`,
      creatorId: bot.id,
      creatorName: bot.name,
      creatorAvatar: bot.avatar,
      creatorAvatarUrl: bot.avatarUrl,
      creatorWins: bot.wins,
      amount: BET_AMOUNTS[i % BET_AMOUNTS.length],
      createdAt: base - (i + 1) * 1000,
      vip: bot.vip,
    }
  })
}

/** Интервал обновления рейтинга — каждые 30 секунд (видно изменение голосов и мест) */
const LEADERBOARD_UPDATE_MS = 30 * 1000

/** Сохранение в localStorage: версия для совместимости при будущих обновлениях */
const SAVE_STORAGE_KEY = "rps_vk_save"
const SAVE_VERSION = 1

const DEFAULT_PLAYER: Player = {
  id: "player1",
  name: "Игрок",
  avatar: "И",
  avatarUrl: "",
  balance: 100,
  wins: 0,
  losses: 0,
  weekWins: 0,
  weekEarnings: 0,
  vip: false,
}

function loadSavedState(): {
  player: Player
  withdrawState: { date: string; amount: number }
  lavaCardStock: number
} | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { version?: number; player?: Partial<Player>; withdrawState?: { date: string; amount: number }; lavaCardStock?: number }
    if (!data || (data.version != null && data.version > SAVE_VERSION)) return null
    const player: Player = { ...DEFAULT_PLAYER, ...data.player }
    const withdrawState = data.withdrawState && typeof data.withdrawState.amount === "number"
      ? { date: String(data.withdrawState.date ?? ""), amount: Number(data.withdrawState.amount) }
      : { date: "", amount: 0 }
    const lavaCardStock = typeof data.lavaCardStock === "number" ? Math.max(0, data.lavaCardStock) : 3
    return { player, withdrawState, lavaCardStock }
  } catch {
    return null
  }
}

function saveState(player: Player, withdrawState: { date: string; amount: number }, lavaCardStock: number) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        player: {
          id: player.id,
          name: player.name,
          avatar: player.avatar,
          avatarUrl: player.avatarUrl,
          balance: player.balance,
          wins: player.wins,
          losses: player.losses,
          weekWins: player.weekWins,
          weekEarnings: player.weekEarnings,
          vip: player.vip,
          fastMatchBoosts: player.fastMatchBoosts,
          victoryAnimation: player.victoryAnimation,
          cardSkin: player.cardSkin,
          avatarFrame: player.avatarFrame,
          tournamentEntry: player.tournamentEntry,
          hideVkAvatar: player.hideVkAvatar,
          lavaCardUses: player.lavaCardUses,
          waterCardUses: player.waterCardUses,
          invitedFriends: player.invitedFriends,
          invitedRewardClaimed: player.invitedRewardClaimed,
          wallPostRewardClaimed: player.wallPostRewardClaimed,
          lastDailyGiftClaimedAt: player.lastDailyGiftClaimedAt,
          dailyRewardIndex: player.dailyRewardIndex,
        },
        withdrawState: { date: withdrawState.date, amount: withdrawState.amount },
        lavaCardStock,
      })
    )
  } catch {
    // ignore
  }
}

function shuffleEarnings(entries: Omit<LeaderboardEntry, "rank">[]): Omit<LeaderboardEntry, "rank">[] {
  return entries.map((e) => ({
    ...e,
    earnings: Math.max(0, e.earnings + Math.floor((Math.random() - 0.5) * 80)),
    wins: Math.max(0, e.wins + Math.floor((Math.random() - 0.5) * 4)),
  }))
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<GameScreen>("entry")
  const [vkUser, setVkUser] = useState<VKUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [player, setPlayer] = useState<Player>(DEFAULT_PLAYER)
  const [opponent, setOpponent] = useState<Player | null>(null)
  const [currentBet, setCurrentBet] = useState(5)
  const [lastResult, setLastResult] = useState<MatchResult | null>(null)
  const [bets, setBets] = useState<BetEntry[]>(MOCK_BETS)
  const [pendingBet, setPendingBet] = useState<PendingBet | null>(null)
  const [betResponse, setBetResponse] = useState<BetResponse | null>(null)
  const [leaderboardVersion, setLeaderboardVersion] = useState(0)
  const [totalRounds, setTotalRounds] = useState<1 | 3 | 5>(1)
  const [withdrawState, setWithdrawState] = useState({ date: "", amount: 0 })
  const [lavaCardStock, setLavaCardStock] = useState(3)
  const [hasLoadedSave, setHasLoadedSave] = useState(false)
  const leaderboardDataRef = useRef(
    STATIC_LEADERBOARD.map((e) => ({ ...e }))
  )
  const betResponseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Таймер: через 1 мин без принятия ставки робот подхватывает, если сумма ≤ 100 */
  const botAutoAcceptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingBetRef = useRef<PendingBet | null>(null)
  useEffect(() => {
    pendingBetRef.current = pendingBet
  }, [pendingBet])
  const lastBotBetAddedRef = useRef(0)

  // Динамика ставок: у роботов botExpiresAt ~15 сек, потом ставка исчезает и список подтягивается; периодически добавляется новая
  useEffect(() => {
    const now = Date.now()
    setBets((prev) =>
      prev.map((b) => {
        if (b.botExpiresAt != null || b.creatorId === player.id) return b
        return { ...b, botExpiresAt: now + 10000 + Math.random() * 10000 }
      })
    )
  }, [player.id])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setBets((prev) => {
        let next = prev.filter((b) => !b.botExpiresAt || b.botExpiresAt > now)
        if (now - lastBotBetAddedRef.current >= 8000 + Math.random() * 10000) {
          lastBotBetAddedRef.current = now
          const r = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)]
          const amounts = [25, 50, 100, 150, 200]
          const newBet: BetEntry = {
            id: `bet-bot-${now}-${Math.floor(Math.random() * 1000)}`,
            creatorId: r.id,
            creatorName: r.name,
            creatorAvatar: r.avatar,
            creatorAvatarUrl: r.avatarUrl,
            creatorWins: r.wins,
            amount: amounts[Math.floor(Math.random() * amounts.length)],
            createdAt: now,
            vip: r.vip,
            botExpiresAt: now + 10000 + Math.random() * 10000,
          }
          next = [newBet, ...next]
        }
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Загрузка сохранённых данных (совместимость с будущими версиями: новые поля берутся из дефолтов)
  useEffect(() => {
    const saved = loadSavedState()
    if (saved) {
      setPlayer(saved.player)
      setWithdrawState(saved.withdrawState)
      setLavaCardStock(saved.lavaCardStock)
    }
    setHasLoadedSave(true)
  }, [])

  // Сохранение в localStorage при изменении игрока, вывода и остатка карты «Лава»
  useEffect(() => {
    if (!hasLoadedSave) return
    saveState(player, withdrawState, lavaCardStock)
  }, [hasLoadedSave, player, withdrawState, lavaCardStock])

  // Инициализация VK Bridge; при запуске на своём сервере — проверка OAuth callback или сохранённой сессии
  useEffect(() => {
    initVKBridge().finally(() => setIsLoading(false))
  }, [])

  // На своём сервере (без Bridge): обработать возврат из VK OAuth или восстановить сессию из localStorage
  useEffect(() => {
    if (isLoading || getBridgeReady()) return
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    const parsed = parseVKHashFragment(hash)
    if (parsed) {
      fetchVKUserByToken(parsed.access_token, parsed.user_id).then((user) => {
        if (user) {
          const expires_at = parsed.expires_in ? Math.floor(Date.now() / 1000) + parsed.expires_in : 0
          saveVKOAuthSession({
            access_token: parsed.access_token,
            user_id: parsed.user_id,
            expires_at,
            user,
          })
          setVkUser(user)
          setPlayer((p) => ({
            ...p,
            id: `vk_${user.id}`,
            name: user.first_name,
            avatar: user.first_name.charAt(0).toUpperCase(),
            avatarUrl: user.photo_200 || user.photo_100 || "",
            hideVkAvatar: p.hideVkAvatar ?? false,
          }))
          setScreen("menu")
          window.history.replaceState(null, "", window.location.pathname + window.location.search)
        }
      })
      return
    }
    const session = getStoredVKOAuthSession()
    if (session) {
      setVkUser(session.user)
      setPlayer((p) => ({
        ...p,
        id: `vk_${session.user.id}`,
        name: session.user.first_name,
        avatar: session.user.first_name.charAt(0).toUpperCase(),
        avatarUrl: session.user.photo_200 || session.user.photo_100 || "",
        hideVkAvatar: p.hideVkAvatar ?? false,
      }))
      setScreen("menu")
    }
  }, [isLoading])

  const loginWithVK = useCallback(async () => {
    const user = await getVKUser()
    if (user) {
      setVkUser(user)
      setPlayer((p) => ({
        ...p,
        id: `vk_${user.id}`,
        name: user.first_name,
        avatar: user.first_name.charAt(0).toUpperCase(),
        avatarUrl: user.photo_200 || user.photo_100 || "",
        hideVkAvatar: p.hideVkAvatar ?? false,
      }))
      setScreen("menu")
    }
  }, [])

  const logoutWithVK = useCallback(() => {
    clearVKOAuthSession()
    setVkUser(null)
    setPlayer((p) => ({ ...p, id: "player1", name: "Игрок", avatar: "И", avatarUrl: "" }))
    setScreen("entry")
  }, [])

  const pickRandomOpponent = useCallback(() => {
    const idx = Math.floor(Math.random() * OPPONENTS.length)
    setOpponent(OPPONENTS[idx])
  }, [])

  const handleSetScreen = useCallback(
    (s: GameScreen) => {
      if (s === "matchmaking") {
        pickRandomOpponent()
      }
      setScreen(s)
    },
    [pickRandomOpponent]
  )

  // Динамический рейтинг: обновление каждые 30 минут с анимацией
  const [displayLeaderboard, setDisplayLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const playerEntry: Omit<LeaderboardEntry, "rank"> = {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      avatarUrl: player.avatarUrl,
      wins: player.weekWins,
      earnings: player.weekEarnings,
      vip: player.vip,
      isPlayer: true,
    }
    const all = [...leaderboardDataRef.current, playerEntry].sort((a, b) => b.earnings - a.earnings)
    return all.map((e, i) => ({ ...e, rank: i + 1 }))
  })

  const updateLeaderboardData = useCallback(() => {
    const playerEntry: Omit<LeaderboardEntry, "rank"> = {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      avatarUrl: player.avatarUrl,
      wins: player.weekWins,
      earnings: player.weekEarnings,
      vip: player.vip,
      isPlayer: true,
    }
    const base = leaderboardDataRef.current.filter((e) => e.id !== player.id)
    const shuffled = shuffleEarnings(base)
    leaderboardDataRef.current = shuffled
    const all = [...shuffled, playerEntry].sort((a, b) => b.earnings - a.earnings)
    const ranked: LeaderboardEntry[] = all.map((e, i) => ({ ...e, rank: i + 1 }))
    setDisplayLeaderboard(ranked)
    setLeaderboardVersion((v) => v + 1)
  }, [player.id, player.name, player.avatar, player.avatarUrl, player.weekWins, player.weekEarnings, player.vip])

  useEffect(() => {
    const playerEntry: Omit<LeaderboardEntry, "rank"> = {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      avatarUrl: player.avatarUrl,
      wins: player.weekWins,
      earnings: player.weekEarnings,
      vip: player.vip,
      isPlayer: true,
    }
    const base = leaderboardDataRef.current.filter((e) => e.id !== player.id)
    const all = [...base, playerEntry].sort((a, b) => b.earnings - a.earnings)
    setDisplayLeaderboard(all.map((e, i) => ({ ...e, rank: i + 1 })))
  }, [player.weekWins, player.weekEarnings, player.id, player.name, player.avatar, player.avatarUrl, player.vip])

  useEffect(() => {
    const t = setInterval(updateLeaderboardData, LEADERBOARD_UPDATE_MS)
    return () => clearInterval(t)
  }, [updateLeaderboardData])

  const { leaderboard, playerRank } = useMemo(() => {
    const pRank = displayLeaderboard.findIndex((e) => e.isPlayer) + 1
    return { leaderboard: displayLeaderboard, playerRank: pRank || displayLeaderboard.length + 1 }
  }, [displayLeaderboard])

  const rankTrendRef = useRef<{ rank: number; earnings: number } | null>(null)
  const [rankTrend, setRankTrend] = useState<"up" | "down" | null>(null)
  useEffect(() => {
    const earnings = player.weekEarnings
    const prev = rankTrendRef.current
    if (prev === null) {
      rankTrendRef.current = { rank: playerRank, earnings }
      setRankTrend(null)
      return
    }
    if (playerRank < prev.rank || earnings > prev.earnings) setRankTrend("up")
    else if (playerRank > prev.rank || earnings < prev.earnings) setRankTrend("down")
    else setRankTrend(null)
    rankTrendRef.current = { rank: playerRank, earnings }
  }, [playerRank, player.weekEarnings])

  const purchaseRankBoost = useCallback(() => {
    const cost = 250
    const bonus = 100
    if (player.balance < cost) return false
    setPlayer((p) => ({
      ...p,
      balance: p.balance - cost,
      weekEarnings: p.weekEarnings + bonus,
    }))
    return true
  }, [player.balance])

  const BOT_AUTO_ACCEPT_AFTER_MS = 60 * 1000
  const MAX_BET_FOR_BOT_AUTO_ACCEPT = 100

  const createBet = useCallback(
    (amount: number, duration: BetDuration = "once") => {
      if (player.balance < amount) return
      if (betResponseTimeoutRef.current) {
        clearTimeout(betResponseTimeoutRef.current)
        betResponseTimeoutRef.current = null
      }
      if (botAutoAcceptTimeoutRef.current) {
        clearTimeout(botAutoAcceptTimeoutRef.current)
        botAutoAcceptTimeoutRef.current = null
      }
      const now = Date.now()
      const id = `pending-${now}`
      setPendingBet({ id, amount, createdAt: now })
      setPlayer((p) => ({ ...p, balance: p.balance - amount }))
      const expiresAt = duration === "1h" ? now + 60 * 60 * 1000 : undefined
      const myBet: BetEntry = {
        id,
        creatorId: player.id,
        creatorName: player.name,
        creatorAvatar: player.avatar,
        creatorWins: player.wins,
        amount,
        createdAt: now,
        expiresAt,
        vip: player.vip,
      }
      setBets((prev) => [myBet, ...prev])
      const r = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)]
      const responseId = `resp-${Date.now()}`
      const hasLivePlayers = Math.random() < 0.7
      const delayMs = hasLivePlayers ? 2500 : 60 * 1000
      betResponseTimeoutRef.current = setTimeout(() => {
        betResponseTimeoutRef.current = null
        setBetResponse({
          id: responseId,
          betId: id,
          responderId: r.id,
          responderName: r.name,
          responderAvatar: r.avatar,
          responderWins: r.wins,
          amount,
        })
      }, delayMs)
      // Если ставку не приняли в течение 1 минуты и сумма не более 100 — робот подхватывает сам
      botAutoAcceptTimeoutRef.current = setTimeout(() => {
        botAutoAcceptTimeoutRef.current = null
        const current = pendingBetRef.current
        if (!current || current.id !== id || current.amount > MAX_BET_FOR_BOT_AUTO_ACCEPT) return
        if (betResponseTimeoutRef.current) {
          clearTimeout(betResponseTimeoutRef.current)
          betResponseTimeoutRef.current = null
        }
        const bot = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)]
        setOpponent({ ...bot, balance: 500, weekWins: Math.floor(bot.wins / 2), weekEarnings: amount * 5 })
        setCurrentBet(amount)
        setBets((prev) => prev.filter((b) => b.id !== id))
        setPendingBet(null)
        setBetResponse(null)
        setTotalRounds(1)
        setScreen("arena")
      }, BOT_AUTO_ACCEPT_AFTER_MS)
    },
    [player.balance, player.id, player.name, player.avatar, player.wins, setScreen, setOpponent, setCurrentBet, setTotalRounds]
  )

  const removeBet = useCallback((betId: string) => {
    setBets((prev) => prev.filter((b) => b.id !== betId))
  }, [])

  const MIN_BET_AMOUNT = 5
  const updatePendingBetAmount = useCallback(
    (newAmount: number) => {
      if (!pendingBet || newAmount < MIN_BET_AMOUNT) return false
      const diff = newAmount - pendingBet.amount
      if (diff === 0) return true
      if (diff > 0 && player.balance < diff) return false
      setPlayer((p) => ({ ...p, balance: p.balance - diff }))
      setPendingBet((p) => (p ? { ...p, amount: newAmount } : null))
      setBets((prev) =>
        prev.map((b) => (b.id === pendingBet.id ? { ...b, amount: newAmount } : b))
      )
      return true
    },
    [pendingBet, player.balance]
  )

  // Очистка таймера отклика и ожидающей ставки только при переходе на экраны,
  // где список ставок недоступен (игра, вывод). На menu/bets/bet-select ставка должна оставаться.
  const screensThatClearPendingBet: GameScreen[] = ["matchmaking", "result", "withdraw", "arena"]
  useEffect(() => {
    if (screensThatClearPendingBet.includes(screen)) {
      if (betResponseTimeoutRef.current) {
        clearTimeout(betResponseTimeoutRef.current)
        betResponseTimeoutRef.current = null
      }
      if (botAutoAcceptTimeoutRef.current) {
        clearTimeout(botAutoAcceptTimeoutRef.current)
        botAutoAcceptTimeoutRef.current = null
      }
      if (pendingBet) {
        setPlayer((p) => ({ ...p, balance: p.balance + pendingBet.amount }))
        setBets((prev) => prev.filter((b) => b.id !== pendingBet.id))
        setPendingBet(null)
        setBetResponse(null)
      }
    }
    return () => {
      if (betResponseTimeoutRef.current) {
        clearTimeout(betResponseTimeoutRef.current)
        betResponseTimeoutRef.current = null
      }
      if (botAutoAcceptTimeoutRef.current) {
        clearTimeout(botAutoAcceptTimeoutRef.current)
        botAutoAcceptTimeoutRef.current = null
      }
    }
  }, [screen, pendingBet])

  const acceptBetResponse = useCallback(() => {
    if (!betResponse) return
    if (botAutoAcceptTimeoutRef.current) {
      clearTimeout(botAutoAcceptTimeoutRef.current)
      botAutoAcceptTimeoutRef.current = null
    }
    setBets((prev) => prev.filter((b) => b.id !== betResponse.betId))
    const bot = OPPONENTS.find((o) => o.id === betResponse.responderId)
    setOpponent(
      bot
        ? { ...bot, balance: 500, weekWins: Math.floor(betResponse.responderWins / 2), weekEarnings: betResponse.amount * 5 }
        : {
            id: betResponse.responderId,
            name: betResponse.responderName,
            avatar: betResponse.responderAvatar,
            avatarUrl: BOT_AVATAR_URL(betResponse.responderId),
            balance: 500,
            wins: betResponse.responderWins,
            losses: 20,
            weekWins: Math.floor(betResponse.responderWins / 2),
            weekEarnings: betResponse.amount * 5,
            vip: false,
          }
    )
    setCurrentBet(betResponse.amount)
    setBetResponse(null)
    setPendingBet(null)
    setTotalRounds(1)
    setScreen("arena")
  }, [betResponse, setScreen, setOpponent, setCurrentBet, setTotalRounds])

  const declineBetResponse = useCallback(() => {
    if (!betResponse) return
    if (botAutoAcceptTimeoutRef.current) {
      clearTimeout(botAutoAcceptTimeoutRef.current)
      botAutoAcceptTimeoutRef.current = null
    }
    setPlayer((p) => ({ ...p, balance: p.balance + betResponse!.amount }))
    setBetResponse(null)
    setPendingBet(null)
  }, [betResponse])

  const clearPendingBet = useCallback(() => {
    if (botAutoAcceptTimeoutRef.current) {
      clearTimeout(botAutoAcceptTimeoutRef.current)
      botAutoAcceptTimeoutRef.current = null
    }
    if (pendingBet) {
      setPlayer((p) => ({ ...p, balance: p.balance + pendingBet.amount }))
      setBets((prev) => prev.filter((b) => b.id !== pendingBet.id))
    }
    setPendingBet(null)
    setBetResponse(null)
  }, [pendingBet])

  const recordWithdraw = useCallback((amount: number) => {
    const today = new Date().toISOString().slice(0, 10)
    setWithdrawState((prev) =>
      prev.date !== today ? { date: today, amount } : { date: today, amount: prev.amount + amount }
    )
  }, [])

  const LAVA_CARD_PRICE = 120_000
  const purchaseLavaCard = useCallback(() => {
    if (lavaCardStock <= 0 || player.balance < LAVA_CARD_PRICE) return false
    setLavaCardStock((s) => s - 1)
    setPlayer((p) => ({
      ...p,
      balance: p.balance - LAVA_CARD_PRICE,
      lavaCardUses: (p.lavaCardUses ?? 0) + 5,
    }))
    return true
  }, [lavaCardStock, player.balance])

  const WATER_CARD_PRICE = 20
  const purchaseWaterCard = useCallback(() => {
    if (player.balance < WATER_CARD_PRICE) return false
    setPlayer((p) => ({
      ...p,
      balance: p.balance - WATER_CARD_PRICE,
      waterCardUses: (p.waterCardUses ?? 0) + 3,
    }))
    return true
  }, [player.balance])

  return (
    <GameContext.Provider
      value={{
        screen,
        setScreen: handleSetScreen,
        player,
        setPlayer,
        opponent,
        setOpponent,
        currentBet,
        setCurrentBet,
        lastResult,
        setLastResult,
        leaderboard,
        playerRank,
        rankTrend,
        leaderboardVersion,
        purchaseRankBoost,
        vkUser,
        loginWithVK,
        logoutWithVK,
        isLoading,
        bets,
        pendingBet,
        betResponse,
        createBet,
        removeBet,
        updatePendingBetAmount,
        acceptBetResponse,
        declineBetResponse,
        clearPendingBet,
        totalRounds,
        setTotalRounds,
        withdrawState,
        recordWithdraw,
        lavaCardStock,
        purchaseLavaCard,
        purchaseWaterCard,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error("useGame must be inside GameProvider")
  return ctx
}
