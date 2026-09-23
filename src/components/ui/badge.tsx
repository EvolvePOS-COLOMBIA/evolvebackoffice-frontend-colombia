import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type BadgeProps = {
  children: ReactNode
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "purple" | "orange"
  className?: string
}

export type BadgeTone = NonNullable<BadgeProps["tone"]>

export const badgeTones: Record<BadgeTone, string> = {
  neutral: "border-border/70 bg-background/60 text-muted-foreground ",
  primary: "border-primary bg-primary/10 dark:text-primary text-primary",
  success: "border-emerald-400/30 bg-emerald-500/10 dark:text-emerald-200 text-emerald-500",
  warning: "border-amber-400/30 bg-amber-500/10 dark:text-amber-200 text-amber-500",
  danger: "border-rose-400/30 bg-rose-500/10 dark:text-rose-200 text-rose-500",
  info: "border-sky-400/30 bg-sky-500/10 dark:text-sky-200 text-sky-500",
  purple: "border-purple-400/30 bg-purple-500/10 dark:text-purple-200 text-purple-500",
  orange: "border-orange-400/30 bg-orange-500/10 dark:text-orange-200 text-orange-500",
}

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
