"use client"

/**
 * VK Mini Apps Bridge — интеграция с ВКонтакте.
 * В продакшене обязательны: VKWebAppInit, получение app_id/hash с бэкенда для оплаты,
 * серверная верификация платежей и вывод через бэкенд.
 * См. docs/VK_INTEGRATION.md
 * Хранимые процедуры (execute.*): lib/vk-stored-procedures.ts, https://dev.vk.com/ru/mini-apps/settings/development/stored-procedures
 */

export interface VKUser {
  id: number
  first_name: string
  last_name: string
  photo_100: string
  photo_200: string
  /** Дата рождения в формате ДД.ММ.ГГГГ или ДД.ММ (если пользователь её открыл) */
  bdate?: string
}

let bridgeReady = false

/** Инициализация VK Bridge. Вызывать при загрузке приложения (уже в GameProvider). */
export async function initVKBridge(): Promise<void> {
  if (typeof window === "undefined") return
  try {
    const vkBridge = await import("@vkontakte/vk-bridge")
    await vkBridge.default.send("VKWebAppInit")
    bridgeReady = true
  } catch {
    bridgeReady = false
  }
}

/** Проверка: приложение открыто в окружении ВК (Bridge инициализирован или в URL есть vk_). */
export function getBridgeReady(): boolean {
  return bridgeReady
}

/** Данные текущего пользователя ВК (VKWebAppGetUserInfo). В dev — мок. */
export async function getVKUser(): Promise<VKUser | null> {
  if (!bridgeReady) {
    return { id: 1, first_name: "Игрок", last_name: "", photo_100: "", photo_200: "" }
  }
  try {
    const vkBridge = await import("@vkontakte/vk-bridge")
    const data = await vkBridge.default.send("VKWebAppGetUserInfo")
    return data as VKUser
  } catch {
    return null
  }
}

/**
 * Покупка голосов: открывает форму оплаты VK (VKWebAppOpenPayForm).
 * — При отмене пользователем или ошибке ВК возвращает false (баланс не начислять).
 * — В продакшене: запрашивать app_id и hash с бэкенда, зачислять баланс только
 *   после серверного подтверждения платежа (callback/webhook от VK). См. docs/VK_INTEGRATION.md
 */
export async function purchaseVKVoices(amount: number): Promise<boolean> {
  if (typeof window === "undefined") return false

  // Вне окружения ВК — ведём себя как раньше: просто симулируем успех.
  if (!bridgeReady) return true

  try {
    // 1. Запрашиваем на бэкенде app_id и подпись для платежа
    const userId = window.localStorage.getItem("rps_vk_user_id") ?? ""
    const res = await fetch("/api/payment/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, userId }),
    })

    if (!res.ok) {
      return false
    }

    const data = (await res.json()) as { ok?: boolean; app_id?: number; hash?: string }
    if (!data.ok || !data.app_id || !data.hash) {
      return false
    }

    const vkBridge = await import("@vkontakte/vk-bridge")
    const payload: Record<string, unknown> = {
      action: "pay-to-service",
      amount,
      app_id: data.app_id,
      hash: data.hash,
    }

    const result = await vkBridge.default.send("VKWebAppOpenPayForm", payload)
    const ok = result && typeof result === "object" ? (result as { result?: boolean }).result : undefined

    // Важно: реальные голоса должны начисляться только после серверного подтверждения платежа.
    // Здесь возвращаем только факт успешного открытия/завершения формы.
    return ok !== false
  } catch {
    return false
  }
}

/** @deprecated Use purchaseVKVoices */
export async function showVKPayment(amount: number): Promise<boolean> {
  return purchaseVKVoices(amount)
}

/**
 * Заявка на вывод голосов.
 * В продакшене: POST на бэкенд (amount, user_id); бэкенд проверяет лимиты и создаёт заявку.
 * Списывать баланс на клиенте только после успешного ответа бэкенда (заявка принята).
 * Иначе при сбое пользователь теряет голоса без вывода. См. docs/VK_INTEGRATION.md
 */
export async function requestWithdraw(amount: number): Promise<boolean> {
  if (amount < 10) return false
  if (typeof window === "undefined") return false

  // Без окружения ВК — оставляем поведение как в dev, чтобы можно было тестировать вне mini-app.
  if (!bridgeReady) return new Promise((r) => setTimeout(() => r(true), 1200))

  try {
    const userId = window.localStorage.getItem("rps_vk_user_id") ?? ""
    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, userId }),
    })

    if (!res.ok) {
      return false
    }

    const data = (await res.json()) as { ok?: boolean }
    return !!data.ok
  } catch {
    return false
  }
}

export function isVKEnvironment(): boolean {
  if (typeof window === "undefined") return false
  return window.location.search.includes("vk_") || bridgeReady
}

/** Данные друга из VKWebAppGetFriends (multi) */
export interface VKFriend {
  id: number
  first_name: string
  last_name: string
  photo_200: string
}

/**
 * Открывает окно выбора друзей ВК (VKWebAppGetFriends с multi: true).
 * Возвращает выбранных пользователей или null при отмене/ошибке.
 */
export async function showFriendsPicker(): Promise<VKFriend[] | null> {
  if (typeof window === "undefined") return null
  if (!bridgeReady) {
    // В dev без ВК — мок: возвращаем пустой массив или тестовых друзей
    return []
  }
  try {
    const vkBridge = await import("@vkontakte/vk-bridge")
    const res = await vkBridge.default.send("VKWebAppGetFriends", { multi: true })
    const data = res && typeof res === "object" ? (res as { users?: VKFriend[] }) : undefined
    return data?.users ?? null
  } catch {
    return null
  }
}

/**
 * Подписка на группу ВК (VKWebAppJoinGroup).
 * ID группы берём из переменной окружения NEXT_PUBLIC_VK_GROUP_ID.
 */
export async function joinVKGroup(): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (!bridgeReady) return true // dev-окружение: считаем, что подписка прошла

  const rawId = process.env.NEXT_PUBLIC_VK_GROUP_ID
  const groupId = rawId ? Number(rawId) : NaN
  if (!Number.isFinite(groupId) || groupId <= 0) return false

  try {
    const vkBridge = await import("@vkontakte/vk-bridge")
    await vkBridge.default.send("VKWebAppJoinGroup", { group_id: groupId })
    return true
  } catch {
    return false
  }
}

/**
 * Открывает стандартное окно приглашения друзей в приложение (VKWebAppShowInviteBox).
 */
export async function showInviteBox(): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (!bridgeReady) return true
  try {
    const vkBridge = await import("@vkontakte/vk-bridge")
    await vkBridge.default.send("VKWebAppShowInviteBox", {})
    return true
  } catch {
    return false
  }
}

/**
 * Публикует пост на стене пользователя (VKWebAppShowWallPostBox).
 * message — текст поста, attachments — вложение (например, ссылка на приложение).
 * Возвращает post_id при успехе или null.
 */
export async function showWallPostBox(message: string, attachments?: string): Promise<number | string | null> {
  if (typeof window === "undefined") return null
  if (!bridgeReady) return 1
  try {
    const vkBridge = await import("@vkontakte/vk-bridge")
    const payload: { message: string; attachments?: string } = { message }
    if (attachments) payload.attachments = attachments
    const res = await vkBridge.default.send("VKWebAppShowWallPostBox", payload)
    const data = res && typeof res === "object" ? (res as { post_id?: number | string }) : undefined
    return data?.post_id ?? null
  } catch {
    return null
  }
}
