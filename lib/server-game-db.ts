/**
 * Общий SQLite для состояния, которое должно быть согласовано между воркерами Node
 * (PM2 cluster, несколько процессов за nginx). Один файл — блокировки на уровне БД.
 */
import fs from "fs"
import path from "path"
import Database from "better-sqlite3"

type GameStateDb = InstanceType<typeof Database>

let db: GameStateDb | null = null
let resolvedGameStateDbPath: string | null = null

function getFallbackGameStateDbPath(): string {
  return path.join(process.cwd(), "data", "game-state.sqlite")
}

function initGameStateDb(dbPath: string): GameStateDb {
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
    CREATE TABLE IF NOT EXISTS friends_ingame_saved (
      user_id TEXT PRIMARY KEY NOT NULL,
      json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS open_match_bets (
      id TEXT PRIMARY KEY NOT NULL,
      creator_id TEXT NOT NULL,
      creator_name TEXT NOT NULL,
      creator_avatar TEXT NOT NULL,
      creator_avatar_url TEXT,
      creator_wins INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      total_rounds INTEGER NOT NULL DEFAULT 1,
      vip INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      expires_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_open_match_bets_creator ON open_match_bets(creator_id);
    CREATE TABLE IF NOT EXISTS pvp_match_sessions (
      match_id TEXT PRIMARY KEY NOT NULL,
      p1_id TEXT NOT NULL,
      p2_id TEXT NOT NULL,
      total_rounds INTEGER NOT NULL,
      bet INTEGER NOT NULL,
      weekly_mode TEXT NOT NULL,
      current_round INTEGER NOT NULL DEFAULT 1,
      p1_score INTEGER NOT NULL DEFAULT 0,
      p2_score INTEGER NOT NULL DEFAULT 0,
      p1_move TEXT,
      p2_move TEXT,
      pending_result TEXT,
      p1_ack INTEGER NOT NULL DEFAULT 0,
      p2_ack INTEGER NOT NULL DEFAULT 0,
      finished INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );
  `)
  const pvpCols = instance.prepare("PRAGMA table_info(pvp_match_sessions)").all() as { name: string }[]
  const pvpColNames = new Set(pvpCols.map((c) => c.name))
  if (!pvpColNames.has("reaction_seq")) {
    instance.exec(`ALTER TABLE pvp_match_sessions ADD COLUMN reaction_seq INTEGER NOT NULL DEFAULT 0`)
  }
  if (!pvpColNames.has("reaction_emoji")) {
    instance.exec(`ALTER TABLE pvp_match_sessions ADD COLUMN reaction_emoji TEXT`)
  }
  if (!pvpColNames.has("reaction_from")) {
    instance.exec(`ALTER TABLE pvp_match_sessions ADD COLUMN reaction_from TEXT`)
  }
  const row = instance.prepare("SELECT data FROM match_queue_state WHERE id = 1").get() as { data: string } | undefined
  if (!row) {
    instance.prepare("INSERT INTO match_queue_state (id, data) VALUES (1, ?)").run(
      JSON.stringify({ buckets: {}, pending: {} }),
    )
  }
  return instance
}

export function getGameStateDbPath(): string {
  if (resolvedGameStateDbPath) return resolvedGameStateDbPath
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
  const preferredPath = getGameStateDbPath()
  const fallbackPath = getFallbackGameStateDbPath()
  let instance: GameStateDb
  try {
    instance = initGameStateDb(preferredPath)
    resolvedGameStateDbPath = preferredPath
  } catch (err) {
    if (preferredPath !== fallbackPath) {
      instance = initGameStateDb(fallbackPath)
      resolvedGameStateDbPath = fallbackPath
      console.error("[game-state-db] preferred path unavailable, switched to fallback", err)
    } else {
      throw err
    }
  }
  db = instance
  return db
}
