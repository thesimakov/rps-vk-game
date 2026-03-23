/** Совпадает с Move в game-context (без импорта «use client» для API). */
export type RpsMove = "rock" | "scissors" | "paper" | "water" | "fire"

/** Исход раунда с точки зрения первого игрока (p) против второго (o). Дублирует логику game-arena для сервера. */
export function getRoundOutcome(p: RpsMove, o: RpsMove): "win" | "loss" | "draw" {
  if (p === o) return "draw"
  const isElementalP = p === "fire" || p === "water" || p === "rock"
  const isElementalO = o === "fire" || o === "water" || o === "rock"
  if (isElementalP && isElementalO) {
    if ((p === "fire" && o === "rock") || (p === "rock" && o === "water") || (p === "water" && o === "fire")) {
      return "win"
    }
    return "loss"
  }
  if (p === "water") {
    if (o === "rock") return "win"
    if (o === "paper") return "loss"
    return "draw"
  }
  if (o === "water") {
    if (p === "rock") return "loss"
    if (p === "paper") return "win"
    return "draw"
  }
  if (
    (p === "rock" && o === "scissors") ||
    (p === "scissors" && o === "paper") ||
    (p === "paper" && o === "rock")
  ) {
    return "win"
  }
  return "loss"
}

/** Исход с точки зрения запрашивающего userId (p1 или p2 в сессии). */
export function getRoundOutcomeForPlayer(
  p1Move: RpsMove,
  p2Move: RpsMove,
  perspectiveUserId: string,
  p1Id: string,
  p2Id: string,
): "win" | "loss" | "draw" {
  const base = getRoundOutcome(p1Move, p2Move)
  if (base === "draw") return "draw"
  const p1Won = base === "win"
  if (perspectiveUserId === p1Id) return p1Won ? "win" : "loss"
  if (perspectiveUserId === p2Id) return p1Won ? "loss" : "win"
  return "draw"
}
