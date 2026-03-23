declare module "better-sqlite3" {
  namespace Database {
    interface RunResult {
      changes: number
      lastInsertRowid: number | bigint
    }
    interface Statement {
      run(...params: unknown[]): RunResult
      get(...params: unknown[]): unknown
      all(...params: unknown[]): unknown[]
    }
  }
  class Database {
    constructor(filename: string, options?: unknown)
    pragma(source: string, options?: unknown): unknown
    exec(sql: string): this
    prepare(sql: string): Database.Statement
    transaction<F extends (...args: never[]) => unknown>(fn: F): F
    close(): void
  }
  export default Database
}
