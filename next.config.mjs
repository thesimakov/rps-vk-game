import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function normalizeBasePath(value) {
  if (!value) return ""
  const v = value.trim()
  if (!v || v === "/") return ""
  const withLeading = v.startsWith("/") ? v : `/${v}`
  return withLeading.endsWith("/") ? withLeading.slice(0, -1) : withLeading
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // В dev нужен нормальный роутинг и dev-сервер.
  // Для VK Hosting/статического деплоя включайте export явно:
  // NEXT_OUTPUT_EXPORT=1 pnpm build
  ...(process.env.NEXT_OUTPUT_EXPORT === "1" ? { output: "export" } : {}),
  ...(process.env.NEXT_OUTPUT_EXPORT === "1" &&
  normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH)
    ? {
        basePath: normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH),
        assetPrefix: normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH),
        trailingSlash: true,
      }
    : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "randomuser.me", pathname: "/**" },
      { protocol: "https", hostname: "vkuser.net", pathname: "/**" },
    ],
  },
  // Важно: у пользователя может быть package-lock.json в домашней папке,
  // из-за чего Turbopack выбирает неверный root и даёт 404 на все роуты.
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
