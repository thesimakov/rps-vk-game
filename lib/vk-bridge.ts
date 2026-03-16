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
    return null
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
 * Покупка внутриигровых монет через виртуальные товары ВКонтакте (голоса).
 *
 * Используем VKWebAppShowOrderBox, как в инструкции по virtual goods:
 * https://dev.vk.com/ru/api/payments/virtual-goods/vk
 *
 * В этом случае списание идёт из внутреннего баланса пользователя (голоса),
 * а не через VK Pay-форму.
 */
export async function purchaseVKVoices(amount: number): Promise<boolean> {
  if (typeof window === "undefined") return false

  try {
    const vkBridge = await import("@vkontakte/vk-bridge")

    if (!bridgeReady) {
      try {
        await vkBridge.default.send("VKWebAppInit")
        bridgeReady = true
      } catch (e) {
        console.error("[VK] VKWebAppInit failed in purchaseVKVoices:", e)
        return false
      }
    }

    // Для виртуальных товаров используется "товар" (item) с фиксированным ID.
    // Привяжем его к количеству монет, чтобы модераторам было понятно.
    const item = `coins_${amount}` // этот же ID нужно указать в настройках виртуальных товаров ВК

    const result = await vkBridge.default.send("VKWebAppShowOrderBox", {
      type: "item",
      item,
      quantity: 1,
    })

    console.log("[VK] VKWebAppShowOrderBox result:", result)
    // При успехе bridge возвращает true, при отмене/ошибке — false.
    if (typeof result === "boolean") {
      return result
    }
    const ok = result && typeof result === "object" ? (result as { success?: boolean }).success : undefined
    return ok !== false
  } catch (e) {
    console.error("[VK] purchaseVKVoices error:", e)
    return false
  }
}

/** @deprecated */
export async function showVKPayment(amount: number): Promise<boolean> {
  return purchaseVKVoices(amount)
}

/**
 * Заявка на вывод виртуальных монет (внутриигрового баланса).
 * В продакшене: POST на бэкенд (amount, user_id); бэкенд проверяет лимиты и создаёт заявку.
 * Списывать баланс на клиенте только после успешного ответа бэкенда (заявка принята).
 * Иначе при сбое пользователь теряет баланс без вывода. См. docs/VK_INTEGRATION.md
 */
export async function requestWithdraw(amount: number): Promise<{ ok: boolean; balance?: number; error?: string }> {
  if (amount < 10) return { ok: false, error: "invalid_amount" }
  if (typeof window === "undefined") return { ok: false, error: "no_window" }

  // Вне окружения ВК — позволяем тестировать, но не трогаем сервер.
  if (!bridgeReady) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ ok: true }), 800)
    )
  }

  try {
    const userId = window.localStorage.getItem("rps_vk_user_id") ?? ""
    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, userId }),
    })

    const data = (await res.json()) as { ok?: boolean; balance?: number; error?: string }
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error ?? "server_error" }
    }
    return { ok: true, balance: typeof data.balance === "number" ? data.balance : undefined }
  } catch {
    return { ok: false, error: "network" }
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
 * По умолчанию используем клуб vk.com/club236519647 (ID 236519647).
 */
export async function joinVKGroup(): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (!bridgeReady) return true // dev-окружение: считаем, что подписка прошла

  const rawId = process.env.NEXT_PUBLIC_VK_GROUP_ID ?? "236519647"
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
  try {
    const vkBridge = await import("@vkontakte/vk-bridge")
    await vkBridge.default.send("VKWebAppShowInviteBox", {})
    return true
  } catch (e) {
    console.error("[VK] showInviteBox error:", e)
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
