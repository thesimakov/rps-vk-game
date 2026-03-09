"use client"

import { useState } from "react"
import { Crown } from "lucide-react"

/** Для списков: картинка с fallback на букву при ошибке или отсутствии URL */
export function AvatarImageOrLetter({
  src,
  letter,
  imgClassName = "w-full h-full object-cover",
}: { src: string | null | undefined; letter: string; imgClassName?: string }) {
  const [useLetter, setUseLetter] = useState(!src)
  const char = (letter || "?").trim().charAt(0).toUpperCase() || "?"
  if (useLetter || !src) {
    return (
      <span className="w-full h-full flex items-center justify-center font-bold text-inherit">
        {char}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      className={imgClassName}
      referrerPolicy="no-referrer"
      onError={() => setUseLetter(true)}
    />
  )
}

interface PlayerAvatarProps {
  name: string
  avatar: string
  avatarUrl?: string
  size?: "sm" | "md" | "lg"
  variant?: "primary" | "destructive" | "accent" | "muted"
  vip?: boolean
}

const sizeMap = {
  sm: "w-9 h-9 text-sm rounded-xl",
  md: "w-14 h-14 text-xl rounded-2xl",
  lg: "w-20 h-20 text-3xl rounded-3xl",
}

const variantMap = {
  primary: "bg-primary/15 border-primary/30 text-primary",
  destructive: "bg-destructive/15 border-destructive/30 text-destructive",
  accent: "bg-accent/15 border-accent/30 text-accent",
  muted: "bg-muted/30 border-border/30 text-foreground/60",
}

/** Обёртка: рисует иконку VIP поверх рамки (впереди рамки), когда аватар в vip-frame или gold-frame */
export function VipBadgeOnFrame({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "w-4 h-4 -top-0.5 -right-0.5" : size === "lg" ? "w-6 h-6 -top-1 -right-1" : "w-5 h-5 -top-0.5 -right-0.5"
  const icon = size === "sm" ? "h-2 w-2" : size === "lg" ? "h-3.5 w-3.5" : "h-2.5 w-2.5"
  return (
    <div className={`absolute z-10 ${s} rounded-full bg-amber-400 border border-amber-500 flex items-center justify-center shadow-sm pointer-events-none`}>
      <Crown className={`${icon} text-amber-900`} />
    </div>
  )
}

export function PlayerAvatar({ name, avatar, avatarUrl, size = "md", variant = "primary", vip }: PlayerAvatarProps) {
  const [useLetter, setUseLetter] = useState(false)
  const sizeClass = sizeMap[size]
  const variantClass = variantMap[variant]
  const showLetter = !avatarUrl || useLetter
  const letter = (avatar || name?.charAt(0) || "?").toUpperCase()

  return (
    <div className="relative inline-flex">
      {showLetter ? (
        <div className={`${sizeClass} border-2 flex items-center justify-center font-black flex-shrink-0 ${variantClass}`}>
          {letter}
        </div>
      ) : (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeClass} border-2 object-cover flex-shrink-0 ${variantClass.split(" ").filter(c => c.startsWith("border-") || c.startsWith("rounded-")).join(" ")}`}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          onError={() => setUseLetter(true)}
        />
      )}
      {vip && (
        <div className="absolute -top-1 -right-1 z-[1] w-5 h-5 rounded-full bg-amber-400 border border-amber-500 flex items-center justify-center shadow-sm">
          <Crown className="h-2.5 w-2.5 text-amber-900" />
        </div>
      )}
    </div>
  )
}
