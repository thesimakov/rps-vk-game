#!/usr/bin/env node
/**
 * Запуск на сервере из корня проекта:
 *   node scripts/presence-db-smoke.js
 * Проверяет: better-sqlite3 грузится, каталог для БД создаётся, файл открывается.
 */
const fs = require("fs")
const path = require("path")

let Database
try {
  Database = require("better-sqlite3")
} catch (e) {
  console.error("[FAIL] Не удалось require('better-sqlite3'):", e.message)
  console.error("Попробуйте: apt install -y build-essential python3 && cd /var/www/rps-vk-game && pnpm rebuild better-sqlite3")
  process.exit(1)
}

const playersPath = process.env.PLAYERS_DB_PATH || ""
let dbPath = process.env.GAME_STATE_DB_PATH || ""
if (!dbPath && playersPath) {
  dbPath = path.join(path.dirname(playersPath), "game-state.sqlite")
}
if (!dbPath) {
  dbPath =
    process.env.NODE_ENV === "development"
      ? path.join(process.cwd(), "data", "game-state.sqlite")
      : "/var/rps-data/game-state.sqlite"
}

console.log("DB path:", dbPath)

try {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
} catch (e) {
  console.error("[FAIL] mkdir:", e.message)
  process.exit(1)
}

try {
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS presence (user_id TEXT PRIMARY KEY NOT NULL, last_seen INTEGER NOT NULL);
    SELECT COUNT(*) FROM presence;
  `)
  db.close()
  console.log("[OK] SQLite открывается, путь рабочий.")
} catch (e) {
  console.error("[FAIL] SQLite:", e.message)
  process.exit(1)
}
