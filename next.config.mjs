import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // В dev нужен нормальный роутинг и dev-сервер.
  // Для VK Hosting/статического деплоя включаем export только в production build.
  ...(process.env.NODE_ENV === "production" ? { output: "export" } : {}),
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
