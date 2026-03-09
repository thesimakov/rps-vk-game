"use client"

/**
 * VK OAuth для входа на своём сервере (вне мини-приложения ВК).
 * После входа оплата и действия с ВК по-прежнему через VK (в мини-приложении или при подключении).
 * См. https://dev.vk.com/api/access-token/implicit-flow-user
 */

import type { VKUser } from "./vk-bridge"

const VK_OAUTH_STORAGE_KEY = "rps_vk_oauth"
const VK_API_VERSION = "5.199"

export interface VKOAuthSession {
  access_token: string
  user_id: number
  expires_at: number
  user: VKUser
}

function getAppId(): string {
  return typeof process.env.NEXT_PUBLIC_VK_APP_ID === "string" ? process.env.NEXT_PUBLIC_VK_APP_ID : ""
}

/** Полный Redirect URI из .env — должен **дословно** совпадать с настройками приложения ВК (иначе Security Error). */
function getConfiguredRedirectUri(): string | null {
  const env = typeof process.env.NEXT_PUBLIC_VK_REDIRECT_URI === "string" ? process.env.NEXT_PUBLIC_VK_REDIRECT_URI.trim() : ""
  return env || null
}

/**
 * Строит URL для редиректа на авторизацию VK (Implicit Flow).
 * redirect_uri должен совпадать с указанным в настройках приложения ВК.
 */
export function getVKOAuthRedirectUrl(redirectUri?: string): string {
  const clientId = getAppId()
  if (!clientId) {
    console.warn("NEXT_PUBLIC_VK_APP_ID не задан — вход через ВК на своём сервере недоступен")
  }
  const base = typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""
  const redirect = redirectUri ?? base
  const params = new URLSearchParams({
    client_id: clientId || "0",
    redirect_uri: redirect,
    response_type: "token",
    scope: "",
    v: VK_API_VERSION,
    revoke: "1",
  })
  return `https://oauth.vk.com/authorize?${params.toString()}`
}

/**
 * URL страницы, на которую ВК сделает редирект после авторизации в попапе.
 * Если задан NEXT_PUBLIC_VK_REDIRECT_URI — используем как есть (должен совпадать с ВК посимвольно).
 * Иначе — текущий origin + /vk-callback. Иначе ВК вернёт Security Error.
 */
export function getVKOAuthPopupCallbackUrl(): string {
  if (typeof window === "undefined") return ""
  const configured = getConfiguredRedirectUri()
  if (configured) return configured
  const origin = window.location.origin.replace(/\/$/, "")
  return `${origin}/vk-callback`
}

/** Тип сообщения от попапа callback к окну приложения */
export const VK_OAUTH_MESSAGE_TYPE = "rps_vk_oauth_result"

export interface VKOAuthMessagePayload {
  type: typeof VK_OAUTH_MESSAGE_TYPE
  access_token: string
  user_id: number
  expires_in: number
}

export type VKOAuthPopupResult =
  | { access_token: string; user_id: number; expires_in: number }
  | { blocked: true }
  | null

/**
 * Открывает стационарное (всплывающее) окно ВК для запроса доступа к данным.
 * Пользователь принимает или отклоняет доступ; при принятии ВК перенаправляет на /vk-callback,
 * откуда в основное окно отправляется postMessage с токеном.
 * Возвращает данные при успехе, { blocked: true } если попап заблокирован браузером, null при отмене пользователем.
 */
export function openVKOAuthPopup(): Promise<VKOAuthPopupResult> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null)
      return
    }
    const callbackUrl = getVKOAuthPopupCallbackUrl()
    const authUrl = getVKOAuthRedirectUrl(callbackUrl)
    const width = 600
    const height = 500
    const left = Math.round((window.screen.width - width) / 2)
    const top = Math.round((window.screen.height - height) / 2)
    const popup = window.open(
      authUrl,
      "vk_oauth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    )
    if (!popup) {
      resolve({ blocked: true })
      return
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as VKOAuthMessagePayload | undefined
      if (data?.type !== VK_OAUTH_MESSAGE_TYPE) return
      cleanup()
      try {
        popup.close()
      } catch {
        // ignore
      }
      resolve({
        access_token: data.access_token,
        user_id: data.user_id,
        expires_in: data.expires_in ?? 0,
      })
    }

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        cleanup()
        resolve(null) // пользователь закрыл окно без авторизации
      }
    }, 300)

    const cleanup = () => {
      clearInterval(checkClosed)
      window.removeEventListener("message", handleMessage)
    }

    window.addEventListener("message", handleMessage)
  })
}

/**
 * Парсит фрагмент URL после редиректа от VK (access_token, user_id, expires_in).
 */
export function parseVKHashFragment(hash: string): { access_token: string; user_id: number; expires_in: number } | null {
  if (!hash || !hash.startsWith("#")) return null
  const params = new URLSearchParams(hash.slice(1))
  const access_token = params.get("access_token")
  const user_id = params.get("user_id")
  const expires_in = params.get("expires_in")
  if (!access_token || !user_id) return null
  const uid = parseInt(user_id, 10)
  const exp = expires_in ? parseInt(expires_in, 10) : 0
  if (!Number.isFinite(uid)) return null
  return { access_token, user_id: uid, expires_in: exp }
}

/**
 * Запрашивает данные пользователя ВК по access_token (users.get).
 */
export async function fetchVKUserByToken(accessToken: string, userId: number): Promise<VKUser | null> {
  const url = new URL("https://api.vk.com/method/users.get")
  url.searchParams.set("user_ids", String(userId))
  url.searchParams.set("fields", "photo_100,photo_200")
  url.searchParams.set("access_token", accessToken)
  url.searchParams.set("v", VK_API_VERSION)
  try {
    const res = await fetch(url.toString())
    const data = (await res.json()) as { response?: Array<{ id: number; first_name: string; last_name: string; photo_100?: string; photo_200?: string }> }
    const user = data?.response?.[0]
    if (!user) return null
    return {
      id: user.id,
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      photo_100: user.photo_100 ?? "",
      photo_200: user.photo_200 ?? user.photo_100 ?? "",
    }
  } catch {
    return null
  }
}

const SESSION_KEY = "rps_vk_oauth_session"

/** Сохраняет сессию в localStorage (для входа после перезагрузки). */
export function saveVKOAuthSession(session: VKOAuthSession): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // ignore
  }
}

/** Читает сессию из localStorage. Возвращает null если нет или истекла. */
export function getStoredVKOAuthSession(): VKOAuthSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as VKOAuthSession
    if (!session?.access_token || !session?.user || !session.expires_at) return null
    if (session.expires_at * 1000 < Date.now()) {
      clearVKOAuthSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

/** Удаляет сохранённую сессию. */
export function clearVKOAuthSession(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

/** Есть ли настроенный APP_ID для OAuth (вход на своём сервере). */
export function isVKOAuthConfigured(): boolean {
  return !!getAppId()
}
