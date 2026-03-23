/**
 * Общий SQLite для состояния, которое должно быть согласовано между воркерами Node
 * (PM2 cluster, несколько процессов за nginx). Один файл — блокировки на уровне БД.
 */
import fs from "fs"
import path from "path"
import Database from "better-sqlite3"

type GameStateDb = InstanceType<typeof Database>

let db: GameStateDb | null = null

export function getGameStateDbPath(): string {
  if (process.env.GAME_STATE_DB_PATH) return process.env.GAME_STATE_DB_PATH
  const playersPath = process.env.PLAYERS_DB_PATH
  if (playersPath) return path.join(path.dirname(playersPath), "game-state.sqlite")
  return process.env.NODE_ENV === "development"
    ? path.join(process.cwd(), "data", "game-state.sqlite")
    : "/var/rps-data/game-state.sqlite"
}

/** Singleton; не вызывать из Edge / static export (только Node API routes). */
export function getGameStateDb(): GameStateDb {
  if (db) return db
  const dbPath = getGameStateDbPath()
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const instance = new Database(dbPath)
  instance.pragma("journal_mode = WAL")
  instance.pragma("busy_timeout = 5000")
  instance.exec(`
    CREATE TABLE IF NOT EXISTS match_queue_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS presence (
      user_id TEXT PRIMARY KEY NOT NULL,
      last_seen INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence(last_seen);
  `)
  const row = instance.prepare("SELECT data FROM match_queue_state WHERE id = 1").get() as { data: string } | undefined
  if (!row) {
    instance.prepare("INSERT INTO match_queue_state (id, data) VALUES (1, ?)").run(
      JSON.stringify({ buckets: {}, pending: {} }),
    )
  }
  db = instance
  return db
}
