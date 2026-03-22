/**
 * Префикс приложения (NEXT_PUBLIC_BASE_PATH): GitHub Pages, VK Mini App в подпапке.
 * Без завершающего слэша. Пустая строка — приложение в корне домена.
 */
export const APP_BASE_PATH = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_PATH
  ? String(process.env.NEXT_PUBLIC_BASE_PATH)
  : ""
).replace(/\/$/, "")

/** Абсолютный путь внутри приложения, с учётом basePath (для fetch к Route Handlers). */
export function appPath(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href
  const path = href.startsWith("/") ? href : `/${href}`
  return `${APP_BASE_PATH}${path}`
}
