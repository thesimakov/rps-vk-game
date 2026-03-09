"use client"

import { useGame } from "@/lib/game-context"
import { formatAmount } from "@/lib/format-amount"
import { useState } from "react"
import { requestWithdraw, isVKEnvironment } from "@/lib/vk-bridge"
import { ArrowLeft, Coins, ArrowDownToLine, CheckCircle2, AlertCircle } from "lucide-react"

/** Минимальный баланс для доступа к выводу (голоса) */
const MIN_BALANCE_FOR_WITHDRAW = 200
/** Максимум голосов к выводу в сутки (лимит ВК-интеграции, см. docs/VK_INTEGRATION.md) */
const MAX_WITHDRAW_PER_DAY = 10_000

export function WithdrawScreen() {
  const { setScreen, player, setPlayer, withdrawState, recordWithdraw } = useGame()
  const [amount, setAmount] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const today = new Date().toISOString().slice(0, 10)
  const withdrawnToday = withdrawState.date === today ? withdrawState.amount : 0
  const remainingDaily = Math.max(0, MAX_WITHDRAW_PER_DAY - withdrawnToday)

  const numAmount = parseInt(amount, 10) || 0
  const canWithdraw =
    player.balance >= MIN_BALANCE_FOR_WITHDRAW &&
    numAmount >= 10 &&
    numAmount <= player.balance &&
    numAmount <= remainingDaily

  const handleWithdraw = async () => {
    if (!canWithdraw) return
    setStatus("loading")
    setErrorMsg("")
    try {
      const ok = await requestWithdraw(numAmount)
      if (ok) {
        setPlayer((p) => ({ ...p, balance: p.balance - numAmount }))
        recordWithdraw(numAmount)
        setStatus("success")
        setAmount("")
      } else {
        setStatus("error")
        setErrorMsg("Минимальная сумма вывода: 10 голосов. Баланс не менее 200. Не более 10 000 в день.")
      }
    } catch {
      setStatus("error")
      setErrorMsg("Ошибка при выводе. Попробуйте позже.")
    }
  }

  const presets = [10, 25, 50, 100]

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6">
      {/* Header */}
      <div className="w-full max-w-md flex items-center mb-6">
        <button
          onClick={() => setScreen("profile")}
          className="p-2.5 rounded-2xl hover:bg-muted/40 transition-colors text-foreground"
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-base font-black text-foreground uppercase tracking-wider">
          Вывод средств
        </h1>
        <div className="w-10" />
      </div>

      {/* Balance card */}
      <div className="w-full max-w-md bg-card/60 border border-accent/20 rounded-3xl p-5 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center">
          <Coins className="h-6 w-6 text-accent" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase">Доступно</p>
          <p className="text-base font-black text-accent tabular-nums">{formatAmount(player.balance)}</p>
        </div>
      </div>

      {/* Amount input */}
      <div className="w-full max-w-md mb-4">
        <label htmlFor="withdraw-amount" className="text-sm font-bold text-foreground mb-2 block">
          Сумма вывода
        </label>
        <div className="relative">
          <input
            id="withdraw-amount"
            type="number"
            min={10}
            max={Math.min(player.balance, remainingDaily)}
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setStatus("idle") }}
            placeholder="Введите сумму..."
            className="w-full bg-card/60 border-2 border-border/40 rounded-2xl px-4 py-4 text-lg font-bold text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:outline-none transition-colors"
          />
          <Coins className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
        </div>
      </div>

      {/* Quick amount buttons */}
      <div className="w-full max-w-md flex gap-2 mb-6">
        {presets.map((v) => (
          <button
            key={v}
            onClick={() => { setAmount(String(v)); setStatus("idle") }}
            disabled={player.balance < v}
            className={`flex-1 py-3 rounded-2xl text-base font-bold transition-all active:scale-95 ${
              numAmount === v
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : player.balance >= v
                ? "bg-card/60 border border-border/30 text-foreground hover:bg-card"
                : "bg-muted/20 text-muted-foreground/40 cursor-not-allowed"
            }`}
          >
            {formatAmount(v)}
          </button>
        ))}
      </div>

      {/* Лимит за день */}
      <div className="w-full max-w-md bg-card/40 border border-border/20 rounded-2xl p-4 mb-4">
        <p className="text-base text-muted-foreground font-medium">
          Осталось вывести сегодня: <span className="font-bold text-base text-foreground">{formatAmount(remainingDaily)}</span> из {formatAmount(MAX_WITHDRAW_PER_DAY)} голосов
        </p>
      </div>

      {/* Info */}
      <div className="w-full max-w-md bg-card/40 border border-border/20 rounded-2xl p-4 mb-6">
        <p className="text-base text-muted-foreground font-medium leading-relaxed">
          Вывод доступен при балансе от {formatAmount(MIN_BALANCE_FOR_WITHDRAW)} голосов. Не более {formatAmount(MAX_WITHDRAW_PER_DAY)} в день. Минимальная сумма заявки: 10 голосов. Обработка до 24 часов.
        </p>
        {!isVKEnvironment() && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
            Для вывода откройте приложение в ВКонтакте.
          </p>
        )}
      </div>

      {/* Status messages */}
      {status === "success" && (
        <div className="w-full max-w-md flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-4">
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm font-bold text-primary">Заявка на вывод принята!</p>
        </div>
      )}
      {status === "error" && (
        <div className="w-full max-w-md flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-2xl p-4 mb-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm font-bold text-destructive">{errorMsg}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleWithdraw}
        disabled={!canWithdraw || status === "loading"}
        className={`w-full max-w-md flex items-center justify-center gap-2 py-4 rounded-2xl text-lg font-black transition-all active:scale-[0.97] ${
          canWithdraw && status !== "loading"
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
            : "bg-muted/30 text-muted-foreground cursor-not-allowed"
        }`}
      >
        <ArrowDownToLine className="h-5 w-5" />
        {status === "loading" ? "Обработка..." : "Вывести"}
      </button>
    </div>
  )
}
