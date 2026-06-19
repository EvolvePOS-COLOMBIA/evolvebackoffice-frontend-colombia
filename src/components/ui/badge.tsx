import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type BadgeProps = {
  children: ReactNode
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "purple" | "orange"
  className?: string
}

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "border-border/70 bg-background/60 text-muted-foreground",
  primary: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  warning: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  danger: "border-rose-400/30 bg-rose-500/10 text-rose-200",
  info: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  purple: "border-purple-400/30 bg-purple-500/10 text-purple-200",
  orange: "border-orange-400/30 bg-orange-500/10 text-orange-200",
}

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
