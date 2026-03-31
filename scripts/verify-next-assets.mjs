#!/usr/bin/env node

/**
 * Проверка целостности Next-ассетов после деплоя:
 * - забирает HTML главной страницы
 * - достаёт все /_next/static/... css/js
 * - проверяет, что каждый URL отвечает 200
 */

const baseUrl = process.argv[2] || "http://127.0.0.1:3000"

function collectNextAssetUrls(html, base) {
  const urls = new Set()
  const patterns = [
    /href="([^"]+)"/g,
    /src="([^"]+)"/g,
  ]
  for (const p of patterns) {
    let m
    while ((m = p.exec(html)) !== null) {
      const raw = m[1]
      if (!raw || !raw.includes("/_next/static/")) continue
      if (!(raw.endsWith(".css") || raw.endsWith(".js"))) continue
      urls.add(new URL(raw, base).toString())
    }
  }
  return Array.from(urls)
}

async function checkStatusOk(url) {
  try {
    let res = await fetch(url, { method: "HEAD", cache: "no-store" })
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", cache: "no-store" })
    }
    return { ok: res.status === 200, status: res.status }
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) }
  }
}

async function main() {
  const root = await fetch(baseUrl, { method: "GET", cache: "no-store" })
  if (root.status !== 200) {
    throw new Error(`Главная страница недоступна: ${baseUrl} -> ${root.status}`)
  }
  const html = await root.text()
  const assetUrls = collectNextAssetUrls(html, baseUrl)
  if (assetUrls.length === 0) {
    throw new Error("Не найдены /_next/static css/js в HTML (проверка неинформативна)")
  }

  const failed = []
  for (const url of assetUrls) {
    const r = await checkStatusOk(url)
    if (!r.ok) failed.push({ url, ...r })
  }

  if (failed.length > 0) {
    console.error("Обнаружены битые ассеты Next:")
    for (const f of failed) {
      console.error(`- ${f.status} ${f.url}${f.error ? ` (${f.error})` : ""}`)
    }
    process.exit(1)
  }

  console.log(`OK: проверено ассетов ${assetUrls.length}, все отвечают 200`)
}

main().catch((err) => {
  console.error("verify-next-assets failed:", err)
  process.exit(1)
})

