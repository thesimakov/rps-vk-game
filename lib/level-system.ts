export const LEVEL_STEP_XP = 100
export const MAX_LEVEL = 30
export const MAX_LEVEL_XP = LEVEL_STEP_XP * MAX_LEVEL

export interface LevelMeta {
  level: number
  name: string
  perk: string
}

export const LEVELS: LevelMeta[] = [
  { level: 1, name: "Новобранец", perk: "Базовый доступ к PvP-матчам." },
  { level: 2, name: "Курсант", perk: "+5% монет к ежедневной награде." },
  { level: 3, name: "Боец", perk: "+20 к покупке буста рейтинга." },
  { level: 4, name: "Тактик", perk: "Скидка 3% в магазине." },
  { level: 5, name: "Стратег", perk: "+10% монет к ежедневной награде." },
  { level: 6, name: "Ветеран", perk: "Скидка 5% в магазине." },
  { level: 7, name: "Чемпион", perk: "+40 к покупке буста рейтинга." },
  { level: 8, name: "Грандмастер", perk: "+15% монет к ежедневной награде." },
  { level: 9, name: "Элита", perk: "Скидка 8% в магазине." },
  { level: 10, name: "Легенда", perk: "Открыт элитный уровень прогрессии." },
  { level: 11, name: "Покоритель", perk: "+18% монет к ежедневной награде." },
  { level: 12, name: "Гладиатор", perk: "+50 к покупке буста рейтинга." },
  { level: 13, name: "Командор", perk: "Скидка 9% в магазине." },
  { level: 14, name: "Титан", perk: "+20% монет к ежедневной награде." },
  { level: 15, name: "Архонт", perk: "Скидка 10% в магазине." },
  { level: 16, name: "Сегун", perk: "+60 к покупке буста рейтинга." },
  { level: 17, name: "Бастион", perk: "+22% монет к ежедневной награде." },
  { level: 18, name: "Фантом", perk: "Скидка 11% в магазине." },
  { level: 19, name: "Зенит", perk: "+70 к покупке буста рейтинга." },
  { level: 20, name: "Император", perk: "+24% монет к ежедневной награде." },
  { level: 21, name: "Авангард", perk: "Скидка 12% в магазине." },
  { level: 22, name: "Шторм", perk: "+80 к покупке буста рейтинга." },
  { level: 23, name: "Кибермагистр", perk: "+26% монет к ежедневной награде." },
  { level: 24, name: "Оракул", perk: "Скидка 14% в магазине." },
  { level: 25, name: "Немезида", perk: "+90 к покупке буста рейтинга." },
  { level: 26, name: "Доминатор", perk: "+28% монет к ежедневной награде." },
  { level: 27, name: "Экзарх", perk: "Скидка 16% в магазине." },
  { level: 28, name: "Сверхновая", perk: "+100 к покупке буста рейтинга." },
  { level: 29, name: "Абсолют", perk: "+30% монет к ежедневной награде." },
  { level: 30, name: "Миф", perk: "Финальный ранг: максимум всех бонусов." },
]

export function clampLevelXp(xp: number): number {
  if (!Number.isFinite(xp)) return 0
  return Math.max(0, Math.min(MAX_LEVEL_XP, Math.floor(xp)))
}

export function getLevelFromXp(levelXp: number): number {
  const xp = clampLevelXp(levelXp)
  return Math.min(MAX_LEVEL, Math.floor(xp / LEVEL_STEP_XP) + 1)
}

export function getLevelMeta(levelXp: number): LevelMeta {
  const level = getLevelFromXp(levelXp)
  return LEVELS[level - 1] ?? LEVELS[0]
}

export function getDailyBonusPercent(levelXp: number): number {
  const level = getLevelFromXp(levelXp)
  if (level >= 29) return 30
  if (level >= 26) return 28
  if (level >= 23) return 26
  if (level >= 20) return 24
  if (level >= 17) return 22
  if (level >= 14) return 20
  if (level >= 11) return 18
  if (level >= 8) return 15
  if (level >= 5) return 10
  if (level >= 2) return 5
  return 0
}

export function getShopDiscountPercent(levelXp: number): number {
  const level = getLevelFromXp(levelXp)
  if (level >= 30) return 20
  if (level >= 27) return 16
  if (level >= 24) return 14
  if (level >= 21) return 12
  if (level >= 18) return 11
  if (level >= 15) return 10
  if (level >= 13) return 9
  if (level >= 9) return 8
  if (level >= 6) return 5
  if (level >= 4) return 3
  return 0
}

export function getRankBoostExtra(levelXp: number): number {
  const level = getLevelFromXp(levelXp)
  if (level >= 28) return 120
  if (level >= 25) return 110
  if (level >= 22) return 100
  if (level >= 19) return 90
  if (level >= 16) return 80
  if (level >= 12) return 60
  if (level >= 7) return 40
  if (level >= 3) return 20
  return 0
}

export function getDiscountedPrice(basePrice: number, levelXp: number): number {
  const discount = getShopDiscountPercent(levelXp)
  if (discount <= 0) return basePrice
  return Math.max(1, Math.floor(basePrice * (1 - discount / 100)))
}
