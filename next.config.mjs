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

const basePathEnv = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH || "")
const isExport = process.env.NEXT_OUTPUT_EXPORT === "1" || process.env.NEXT_OUTPUT_EXPORT === "true" || !!process.env.GITHUB_ACTIONS

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: basePathEnv || undefined,
  assetPrefix: basePathEnv || undefined,
  output: isExport ? "export" : undefined,
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
