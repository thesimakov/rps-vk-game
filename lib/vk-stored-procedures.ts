"use client"

/**
 * Вызов хранимых процедур ВКонтакте (VKScript).
 *
 * Хранимые процедуры — функции на VKScript, хранятся в настройках мини-приложения
 * (Разработка → Хранимые процедуры), выполняются на серверах ВК. Вызов — через
 * метод execute.ИМЯ_ПРОЦЕДУРЫ.
 *
 * Документация: https://dev.vk.com/ru/mini-apps/settings/development/stored-procedures
 *
 * Особенности:
 * - Название при вызове всегда с префиксом execute. (например execute.getUserBalance).
 * - Параметры передаются при вызове, в коде процедуры доступны как Args.param_name.
 * - В процедуре: API.methodName(...), результат — r@.field_name; return { "result": ... }.
 */

import { getBridgeReady } from "./vk-bridge"

/** Версия API ВКонтакте для вызовов из процедур (указывается в настройках процедуры и при вызове). */
export const VK_API_VERSION = "5.134"

/**
 * Вызывает хранимую процедуру мини-приложения через VKWebAppCallAPIMethod.
 *
 * @param procedureName — имя процедуры латиницей (без префикса execute.), например "getUserBalance"
 * @param params — параметры процедуры (в VKScript: Args.param_name)
 * @param options — apiVersion (по умолчанию VK_API_VERSION), func_v — версия процедуры при наличии нескольких
 * @returns ответ метода execute (обычно { response: ... } или { error: ... })
 */
export async function callStoredProcedure<T = unknown>(
  procedureName: string,
  params: Record<string, string | number | boolean | undefined> = {},
  options?: { apiVersion?: string; funcVersion?: string }
): Promise<{ response?: T; error?: { error_code: number; error_msg?: string } }> {
  if (typeof window === "undefined") {
    return { error: { error_code: -1, error_msg: "Not in browser" } }
  }
  if (!getBridgeReady()) {
    return { error: { error_code: -2, error_msg: "VK Bridge not ready" } }
  }

  const method = `execute.${procedureName}`
  const apiVersion = options?.apiVersion ?? VK_API_VERSION

  const sendParams: Record<string, string | number | boolean> = {
    ...params,
    v: apiVersion,
  }
  if (options?.funcVersion != null) {
    sendParams.func_v = options.funcVersion
  }

  try {
    const vkBridge = await import("@vkontakte/vk-bridge")
    const result = await vkBridge.default.send("VKWebAppCallAPIMethod", {
      method,
      params: sendParams,
    })

    const data = result && typeof result === "object" ? (result as { response?: T; error?: { error_code: number; error_msg?: string } }) : {}
    return data
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { error: { error_code: -3, error_msg: msg } }
  }
}
