/**
 * Форматирование сумм: 1000 → 1к, 10 000 → 10к, 120 000 → 120к.
 * Отрицательные: -1000 → -1к.
 */
export function formatAmount(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : ""
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000
    return sign + (v % 1 === 0 ? v : v.toFixed(1).replace(/\.0$/, "")) + "м"
  }
  if (abs >= 1000) {
    const v = abs / 1000
    return sign + (v % 1 === 0 ? v : v.toFixed(1).replace(/\.0$/, "")) + "к"
  }
  return String(n)
}
